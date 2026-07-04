import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Returns live post counts for the given thread ids. Used by the client to
 * detect updates in watched threads. Returns only counts, no author data.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const idsParam = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .slice(0, 200);
  if (ids.length === 0) return NextResponse.json({ counts: {} });

  const { rows } = await db.query(
    `select p.thread_id, count(*)::int as n
     from posts p
     join threads t on t.id = p.thread_id
     join boards b on b.id = t.board_id
     where p.thread_id = any($1::bigint[])
       and p.deleted_at is null
       and t.deleted_at is null
       and not b.archived
     group by p.thread_id`,
    [ids],
  );

  const counts: Record<string, number> = {};
  for (const r of rows) counts[String(r.thread_id)] = r.n;
  return NextResponse.json({ counts });
}
