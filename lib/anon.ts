import { createHmac } from "node:crypto";

// The only link between a post and its author. Same user + same thread =>
// same label; different thread => unrelated label. De-anonymizing requires
// ANON_SECRET plus brute-forcing the member list -- impossible by accident.
export function authorHmac(userId: string, threadId: string): string {
  const secret = process.env.ANON_SECRET;
  if (!secret) throw new Error("ANON_SECRET is not set");
  return createHmac("sha256", secret).update(`${userId}:${threadId}`).digest("hex");
}

/** Display suffix only; the localized "Anon"/"Анон" prefix is added at render. */
export function authorLabel(hmac: string): string {
  return hmac.slice(0, 6);
}
