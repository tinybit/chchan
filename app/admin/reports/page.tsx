import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n";
import { banAuthorOfPost, deletePost, hidePost, resolveReport } from "@/lib/actions";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getT();
  const { rows: reports } = await db.query(
    `select r.id, r.reason, r.created_at, p.id as post_id, p.body, p.hidden, p.author_label
     from reports r join posts p on p.id = r.post_id
     where r.resolved_at is null and p.deleted_at is null
     order by r.created_at`,
  );

  return (
    <>
      {error && <div className="error">{error}</div>}
      {reports.length === 0 && <p className="muted">{t.admin.nothingReported}</p>}
      {reports.map((r) => (
        <div className="post" key={r.id}>
          <div className="post-meta">
            <span className="label">
              {t.post.anon} {r.author_label}
            </span>{" "}
            {t.admin.postNo}
            {r.post_id}
            {r.hidden && <b>{t.post.hiddenTag}</b>} &mdash; {t.admin.reportedOn}{" "}
            {formatDate(r.created_at)}
          </div>
          <div className="post-body">{String(r.body).slice(0, 500)}</div>
          <form action={hidePost} style={{ display: "inline" }}>
            <input type="hidden" name="postId" value={r.post_id} />
            <input type="hidden" name="backPath" value="/admin/reports" />
            <button type="submit">{r.hidden ? t.post.unhide : t.post.hide}</button>
          </form>{" "}
          <form action={deletePost} style={{ display: "inline" }}>
            <input type="hidden" name="postId" value={r.post_id} />
            <input type="hidden" name="backPath" value="/admin/reports" />
            <button type="submit">{t.post.del}</button>
          </form>{" "}
          <form action={banAuthorOfPost} style={{ display: "inline" }}>
            <input type="hidden" name="postId" value={r.post_id} />
            <input type="hidden" name="backPath" value="/admin/reports" />
            <button type="submit">{t.post.banAuthor}</button>
          </form>{" "}
          <form action={resolveReport} style={{ display: "inline" }}>
            <input type="hidden" name="reportId" value={r.id} />
            <button type="submit">{t.admin.resolve}</button>
          </form>
        </div>
      ))}
    </>
  );
}
