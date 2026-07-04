import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE = "chchan_session";
const SESSION_TTL_DAYS = 30;

export type Role = "member" | "admin" | "root";

export type SessionUser = {
  id: string;
  email: string;
  status: "pending" | "approved" | "banned";
  role: Role;
  /** admin or root */
  isAdmin: boolean;
  rulesAccepted: boolean;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toSessionUser(r: {
  id: unknown;
  email: string;
  status: SessionUser["status"];
  role: Role;
  rules_accepted_at?: Date | null;
}): SessionUser {
  return {
    id: String(r.id),
    email: r.email,
    status: r.status,
    role: r.role,
    isAdmin: r.role === "admin" || r.role === "root",
    rulesAccepted: r.rules_accepted_at != null,
  };
}

export function isRootEmail(email: string): boolean {
  const root = (process.env.ROOT_EMAIL ?? "").trim().toLowerCase();
  return root !== "" && email.toLowerCase() === root;
}

export async function createSession(userId: string): Promise<void> {
  // Opportunistic cleanup: expired sessions are dead login-history rows.
  await db.query("delete from sessions where expires_at < now()");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000);
  await db.query(
    "insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)",
    [hashToken(token), userId, expiresAt],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.query("delete from sessions where token_hash = $1", [hashToken(token)]);
  }
  store.delete(SESSION_COOKIE);
}

/** Memoized per request: layout and page both call this without a second query. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await db.query(
    `select u.id, u.email, u.status, u.role, u.rules_accepted_at
     from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows.length > 0 ? toSessionUser(rows[0]) : null;
});

export async function requireApproved(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.status !== "approved") throw new Error("not authorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireApproved();
  if (!user.isAdmin) throw new Error("not authorized");
  return user;
}

export async function requireRoot(): Promise<SessionUser> {
  const user = await requireApproved();
  if (user.role !== "root") throw new Error("not authorized");
  return user;
}

/**
 * Upsert on login. ROOT_EMAIL always comes out as an approved root, even if
 * the row existed before with a lesser role -- root status lives in the env,
 * not the database, so it cannot be taken away from inside the app.
 */
export async function upsertUser(email: string, googleSub: string | null): Promise<SessionUser> {
  const root = isRootEmail(email);
  const { rows } = await db.query(
    `insert into users (email, google_sub, status, role, approved_at)
     values ($1, $2, $3, $4, case when $3 = 'approved' then now() else null end)
     on conflict (email) do update set
       google_sub = coalesce(excluded.google_sub, users.google_sub),
       role = case when excluded.role = 'root' then 'root' else users.role end,
       status = case when excluded.role = 'root' then 'approved' else users.status end
     returning id, email, status, role, rules_accepted_at`,
    [email.toLowerCase(), googleSub, root ? "approved" : "pending", root ? "root" : "member"],
  );
  return toSessionUser(rows[0]);
}
