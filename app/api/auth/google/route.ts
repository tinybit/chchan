import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 500 });
  }
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // No hd param here on purpose: it would lock Google's sign-in form to the
  // workspace domain and block the root Gmail account. Domain enforcement
  // happens in the callback against the verified token claims.
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
