import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guardApproved } from "@/lib/guard";
import { createThread } from "@/lib/actions";
import { Post, type PostRow } from "@/components/Post";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const user = await guardApproved();
  const { slug } = await params;
  const { error, notice } = await searchParams;

  const { rows: boards } = await db.query(
    "select id, slug, name, description from boards where slug = $1",
    [slug],
  );
  if (boards.length === 0) notFound();
  const board = boards[0];

  // Each thread with its OP post and reply count, newest bump first.
  const { rows: threads } = await db.query(
    `select t.id as thread_id, t.subject, t.locked,
            p.id, p.body, p.author_label, p.created_at, p.hidden,
            i.storage_key, i.thumb_key,
            (select count(*) - 1 from posts px where px.thread_id = t.id and px.deleted_at is null) as replies
     from threads t
     join lateral (
       select * from posts where thread_id = t.id and deleted_at is null order by id limit 1
     ) p on true
     left join images i on i.post_id = p.id
     where t.board_id = $1 and t.deleted_at is null
     order by t.bumped_at desc
     limit 50`,
    [board.id],
  );

  return (
    <main>
      <h1>
        /{board.slug}/ - {board.name}
      </h1>
      <p className="muted">{board.description}</p>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <form className="compose" action={createThread}>
        <h3>New thread</h3>
        <input type="hidden" name="board" value={board.slug} />
        <label htmlFor="subject">Subject</label>
        <input id="subject" name="subject" type="text" maxLength={120} required />
        <label htmlFor="body">Comment</label>
        <textarea id="body" name="body" maxLength={8000} required />
        <label htmlFor="image">Image (optional, max 8 MB)</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" />
        <button type="submit">Post thread</button>
      </form>

      {threads.map((t) => (
        <div className="thread" key={t.thread_id}>
          <h3>
            <Link href={`/b/${board.slug}/${t.thread_id}`}>{t.subject}</Link>
            {t.locked ? " [locked]" : ""}
          </h3>
          <Post post={t as PostRow} backPath={`/b/${board.slug}`} isAdmin={user.isAdmin} />
          <Link href={`/b/${board.slug}/${t.thread_id}`}>
            {t.replies} {Number(t.replies) === 1 ? "reply" : "replies"}
          </Link>
        </div>
      ))}
      {threads.length === 0 && <p className="muted">No threads yet. Start one.</p>}
    </main>
  );
}
