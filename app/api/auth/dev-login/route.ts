import { NextRequest, NextResponse } from "next/server";
import { createSession, upsertUser } from "@/lib/auth";

/** Local development only: log in as any email without Google. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production" || process.env.DEV_FAKE_AUTH !== "1") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const email = new URL(req.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email query param required" }, { status: 400 });
  }
  const user = await upsertUser(email, null);
  await createSession(user.id);
  return NextResponse.redirect(
    `${process.env.APP_URL}${user.status === "approved" ? "/" : "/pending"}`,
  );
}
