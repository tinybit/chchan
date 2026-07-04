import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  await destroySession();
  return NextResponse.redirect(`${process.env.APP_URL}/login`, 303);
}
