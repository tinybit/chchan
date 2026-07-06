import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") === "ru" ? "ru" : "en";
  (await cookies()).set("lang", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 3600,
  });
  const back = req.headers.get("referer") ?? `${process.env.APP_URL}/`;
  return NextResponse.redirect(back);
}
