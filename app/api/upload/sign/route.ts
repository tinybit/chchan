import { NextRequest, NextResponse } from "next/server";
import { requireApproved } from "@/lib/auth";
import { isAllowedImageType, MAX_IMAGE_BYTES, newTempKey } from "@/lib/images";
import { presignUpload } from "@/lib/storage";

/**
 * Hands an approved member a one-shot upload target for a temp object.
 * The browser uploads the raw image there directly (bypassing the Vercel
 * function body limit); the post action later fetches, sanitizes, finalizes.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireApproved();
  } catch {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const { contentType, size } = (await req.json().catch(() => ({}))) as {
    contentType?: string;
    size?: number;
  };
  if (!contentType || !isAllowedImageType(contentType)) {
    return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "image too large (max 8 MB)" }, { status: 400 });
  }

  const key = newTempKey();
  const url = await presignUpload(key, contentType);
  return NextResponse.json({ key, url });
}
