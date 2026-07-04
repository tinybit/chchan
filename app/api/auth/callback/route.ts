import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSession, isRootEmail, upsertUser } from "@/lib/auth";

type IdTokenClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  hd?: string;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${process.env.APP_URL}/login?error=oauth`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(`${process.env.APP_URL}/login?error=oauth`);
  }
  const { id_token: idToken } = (await tokenRes.json()) as { id_token: string };

  // The token came straight from Google's token endpoint over TLS, so we can
  // decode without signature verification.
  const claims = JSON.parse(
    Buffer.from(idToken.split(".")[1], "base64url").toString(),
  ) as IdTokenClaims;

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? "clickhouse.com";
  // hd is the load-bearing check: the hd URL parameter on the auth request is
  // cosmetic and any Google account can reach this callback without it.
  // Exactly one non-domain account is allowed in: the configured root email.
  if (!claims.email || !claims.email_verified) {
    return NextResponse.redirect(`${process.env.APP_URL}/login?error=domain`);
  }
  if (claims.hd !== allowedDomain && !isRootEmail(claims.email)) {
    return NextResponse.redirect(`${process.env.APP_URL}/login?error=domain`);
  }

  const user = await upsertUser(claims.email, claims.sub);
  if (user.status === "banned") {
    return NextResponse.redirect(`${process.env.APP_URL}/login?error=banned`);
  }
  await createSession(user.id);
  return NextResponse.redirect(
    `${process.env.APP_URL}${user.status === "approved" ? "/" : "/pending"}`,
  );
}
