import { NextRequest, NextResponse } from "next/server";
import { requireApproved } from "@/lib/auth";
import { isTempKey } from "@/lib/images";
import { putObject, usingR2 } from "@/lib/storage";

/**
 * Local-dev only: receives the direct upload to disk (R2 uses a presigned PUT
 * straight to the bucket instead, so this never runs in production).
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  if (usingR2) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    await requireApproved();
  } catch {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!isTempKey(key)) return NextResponse.json({ error: "bad key" }, { status: 400 });
  const buf = Buffer.from(await req.arrayBuffer());
  await putObject(key, buf);
  return NextResponse.json({ ok: true });
}
