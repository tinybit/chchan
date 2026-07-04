import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guardApproved } from "@/lib/guard";
import { createReply, lockThread } from "@/lib/actions";
import { getT } from "@/lib/i18n";
import { Post, type PostRow } from "@/components/Post";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; threadId: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const user = await guardApproved();
  const { slug, threadId } = await params;
  const { error, notice } = await searchParams;
  const t = await getT();

  const { rows: threads } = await db.query(
    `select t.id, t.subject, t.locked, b.slug, b.name, b.archived
     from threads t join boards b on b.id = t.board_id
     where t.id = $1 and b.slug = $2 and t.deleted_at is null`,
    [threadId, slug],
  );
  if (threads.length === 0) notFound();
  const thread = threads[0];
  if (thread.archived && user.role !== "root") notFound();
  const threadPath = `/b/${slug}/${threadId}`;

  const { rows: posts } = await db.query(
    `select p.id, p.body, p.author_label, p.created_at, p.hidden, i.storage_key, i.thumb_key
     from posts p left join images i on i.post_id = p.id
     where p.thread_id = $1 and p.deleted_at is null
     order by p.id`,
    [threadId],
  );

  return (
    <main>
      <div className="toolbar">
        <Link href={`/b/${slug}`}>{t.thread.backTo(slug)}</Link>
        {user.isAdmin && (
          <form action={lockThread} style={{ display: "inline", marginLeft: 12 }}>
            <input type="hidden" name="threadId" value={thread.id} />
            <input type="hidden" name="backPath" value={threadPath} />
            <button className="linkish" type="submit">
              {thread.locked ? t.thread.unlock : t.thread.lock}
            </button>
          </form>
        )}
      </div>
      <h1>
        {thread.subject}
        {thread.locked ? t.board.locked : ""}
      </h1>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {posts.map((p) => (
        <Post
          key={p.id}
          post={p as PostRow}
          backPath={threadPath}
          isAdmin={user.isAdmin}
          canReply={!thread.locked}
        />
      ))}

      {!thread.locked && (
        <form className="compose" action={createReply}>
          <h3>{t.thread.reply}</h3>
          <input type="hidden" name="threadId" value={thread.id} />
          <label htmlFor="body">{t.board.comment}</label>
          <textarea id="body" name="body" maxLength={8000} required />
          <label htmlFor="image">{t.board.image}</label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" />
          <button type="submit">{t.thread.postReply}</button>
        </form>
      )}
    </main>
  );
}
