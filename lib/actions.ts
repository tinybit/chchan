"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin, requireApproved, requireRoot } from "./auth";
import { authorHmac, authorLabel } from "./anon";
import { checkRateLimit } from "./ratelimit";
import { processUpload } from "./images";

const MAX_BODY = 8000;
const MAX_SUBJECT = 120;

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function attachImage(postId: string, file: File | null, errPath: string): Promise<void> {
  if (!file || file.size === 0) return;
  let img;
  try {
    img = await processUpload(file);
  } catch (e) {
    fail(errPath, e instanceof Error ? e.message : "image processing failed");
  }
  await db.query(
    `insert into images (post_id, storage_key, thumb_key, mime, bytes, width, height)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [postId, img.storageKey, img.thumbKey, img.mime, img.bytes, img.width, img.height],
  );
}

export async function createThread(formData: FormData): Promise<void> {
  const user = await requireApproved();
  const boardSlug = String(formData.get("board") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("image") as File | null;
  const boardPath = `/b/${boardSlug}`;

  if (!subject || subject.length > MAX_SUBJECT) fail(boardPath, "subject required (max 120 chars)");
  if (!body || body.length > MAX_BODY) fail(boardPath, "body required (max 8000 chars)");

  const { rows: boards } = await db.query("select id from boards where slug = $1", [boardSlug]);
  if (boards.length === 0) fail("/", "no such board");
  await checkRateLimit(user.id, "thread").catch((e) => fail(boardPath, e.message));

  const { rows: threads } = await db.query(
    "insert into threads (board_id, subject) values ($1, $2) returning id",
    [boards[0].id, subject],
  );
  const threadId = String(threads[0].id);
  const hmac = authorHmac(user.id, threadId);
  const { rows: posts } = await db.query(
    "insert into posts (thread_id, body, author_label, author_hmac) values ($1, $2, $3, $4) returning id",
    [threadId, body, authorLabel(hmac), hmac],
  );
  await attachImage(String(posts[0].id), file, boardPath);

  revalidatePath(boardPath);
  redirect(`${boardPath}/${threadId}`);
}

export async function createReply(formData: FormData): Promise<void> {
  const user = await requireApproved();
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("image") as File | null;

  const { rows: threads } = await db.query(
    `select t.id, t.locked, b.slug from threads t join boards b on b.id = t.board_id
     where t.id = $1 and t.deleted_at is null`,
    [threadId],
  );
  if (threads.length === 0) fail("/", "no such thread");
  const threadPath = `/b/${threads[0].slug}/${threadId}`;

  if (threads[0].locked) fail(threadPath, "thread is locked");
  if (!body || body.length > MAX_BODY) fail(threadPath, "body required (max 8000 chars)");
  await checkRateLimit(user.id, "post").catch((e) => fail(threadPath, e.message));

  const hmac = authorHmac(user.id, threadId);
  const { rows: posts } = await db.query(
    "insert into posts (thread_id, body, author_label, author_hmac) values ($1, $2, $3, $4) returning id",
    [threadId, body, authorLabel(hmac), hmac],
  );
  await attachImage(String(posts[0].id), file, threadPath);
  await db.query("update threads set bumped_at = now() where id = $1", [threadId]);

  revalidatePath(threadPath);
  redirect(threadPath);
}

export async function acceptRules(): Promise<void> {
  const user = await requireApproved();
  await db.query(
    "update users set rules_accepted_at = now() where id = $1 and rules_accepted_at is null",
    [user.id],
  );
  redirect("/");
}

export async function reportPost(formData: FormData): Promise<void> {
  await requireApproved();
  const postId = String(formData.get("postId") ?? "");
  const reason = String(formData.get("reason") ?? "other");
  const backPath = String(formData.get("backPath") ?? "/");
  await db.query("insert into reports (post_id, reason) values ($1, $2)", [postId, reason]);
  redirect(`${backPath}?notice=${encodeURIComponent("report submitted")}`);
}

// --- Admin actions. Every one is written to mod_actions. ---

async function logMod(
  adminId: string,
  action: string,
  targetKind: "post" | "thread" | "user",
  targetId: string,
  note = "",
): Promise<void> {
  await db.query(
    "insert into mod_actions (admin_id, action, target_kind, target_id, note) values ($1, $2, $3, $4, $5)",
    [adminId, action, targetKind, targetId, note],
  );
}

export async function approveUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  await db.query(
    "update users set status = 'approved', approved_at = now() where id = $1 and status = 'pending'",
    [userId],
  );
  await logMod(admin.id, "approve", "user", userId);
  revalidatePath("/admin");
  redirect("/admin");
}

/** Admins can ban members; only root can ban admins; nobody bans root. */
export async function banUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const { rows } = await db.query("select role from users where id = $1", [userId]);
  if (rows.length === 0) redirect("/admin");
  const targetRole = rows[0].role as string;
  if (targetRole === "root" || (targetRole === "admin" && admin.role !== "root")) {
    fail("/admin", "you cannot ban this user");
  }
  await db.query("update users set status = 'banned' where id = $1", [userId]);
  await db.query("delete from sessions where user_id = $1", [userId]);
  await logMod(admin.id, "ban", "user", userId);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function setAdminRole(formData: FormData): Promise<void> {
  const root = await requireRoot();
  const userId = String(formData.get("userId") ?? "");
  const makeAdmin = String(formData.get("makeAdmin") ?? "") === "1";
  await db.query(
    `update users set role = $1
     where id = $2 and role <> 'root' and status = 'approved'`,
    [makeAdmin ? "admin" : "member", userId],
  );
  await logMod(root.id, makeAdmin ? "promote-admin" : "demote-admin", "user", userId);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function hidePost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin");
  await db.query("update posts set hidden = not hidden where id = $1", [postId]);
  await logMod(admin.id, "toggle-hide", "post", postId);
  revalidatePath(backPath);
  redirect(backPath);
}

export async function deletePost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin");
  await db.query("update posts set deleted_at = now() where id = $1", [postId]);
  await logMod(admin.id, "delete", "post", postId);
  revalidatePath(backPath);
  redirect(backPath);
}

export async function lockThread(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const threadId = String(formData.get("threadId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin");
  await db.query("update threads set locked = not locked where id = $1", [threadId]);
  await logMod(admin.id, "toggle-lock", "thread", threadId);
  revalidatePath(backPath);
  redirect(backPath);
}

export async function resolveReport(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  await db.query(
    "update reports set resolved_at = now(), resolved_by = $1 where id = $2",
    [admin.id, reportId],
  );
  revalidatePath("/admin");
  redirect("/admin");
}

/**
 * The one deliberate deanonymization path: recompute the author HMAC against
 * every member to find who wrote a post, then ban them. Always logged.
 */
export async function banAuthorOfPost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const { rows: posts } = await db.query(
    "select thread_id, author_hmac from posts where id = $1",
    [postId],
  );
  if (posts.length === 0) redirect("/admin");
  const { thread_id: threadId, author_hmac: target } = posts[0];

  const { rows: users } = await db.query("select id, role from users where status = 'approved'");
  const match = users.find((u) => authorHmac(String(u.id), String(threadId)) === target);
  if (!match) redirect(`/admin?error=${encodeURIComponent("author not found among members")}`);
  if (match!.role === "root" || (match!.role === "admin" && admin.role !== "root")) {
    fail("/admin", "you cannot ban this user");
  }

  await db.query("update users set status = 'banned' where id = $1", [match!.id]);
  await db.query("delete from sessions where user_id = $1", [match!.id]);
  await logMod(admin.id, "ban-author", "post", postId, "author resolved via HMAC scan");
  revalidatePath("/admin");
  redirect("/admin");
}
