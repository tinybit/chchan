import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getObject } from "@/lib/storage";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

/** Serves uploaded images from the storage backend. Members only. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const { key } = await params;
  const objectKey = key.join("/");
  const data = await getObject(objectKey);
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const mime = MIME[path.extname(objectKey)] ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    headers: { "content-type": mime, "cache-control": "private, max-age=86400" },
  });
}
