import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { uploadsRoot } from "@/lib/storage";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

/** Dev-only file server for the local storage backend. Members only. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const { key } = await params;
  const root = uploadsRoot();
  const target = path.resolve(root, key.join("/"));
  if (!target.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }

  try {
    const data = await readFile(target);
    const mime = MIME[path.extname(target)] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: { "content-type": mime, "cache-control": "private, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
