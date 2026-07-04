import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./auth";

/**
 * Page-level gate: bounce anonymous visitors to /login, unapproved to
 * /pending, and freshly approved members to the rules page until accepted.
 */
export async function guardApproved(): Promise<SessionUser> {
  const user = await guardMember();
  if (!user.rulesAccepted) redirect("/rules");
  return user;
}

/** Same gate minus the rules-acceptance redirect (used by the rules page itself). */
export async function guardMember(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status === "banned") redirect("/login?error=banned");
  if (user.status !== "approved") redirect("/pending");
  return user;
}
