import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guardApproved } from "@/lib/guard";
import { getLang, getT } from "@/lib/i18n";
import { boardName, boardDescription } from "@/lib/boards";
import { Post, type PostRow } from "@/components/Post";
import { NewThreadModal } from "@/components/NewThreadModal";

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
  const [lang, t] = await Promise.all([getLang(), getT()]);

  const { rows: boards } = await db.query(
    "select id, slug, name, description, name_ru, description_ru, archived from boards where slug = $1",
    [slug],
  );
  if (boards.length === 0) notFound();
  const board = boards[0];
  // Archived boards exist only for root (to prepare content before unarchiving).
  if (board.archived && user.role !== "root") notFound();

  // Each thread with its OP post (images aggregated) and reply count.
  const { rows: threads } = await db.query(
    `select t.id as thread_id, t.subject, t.locked,
            p.id, p.body, p.author_label, p.created_at, p.hidden,
            coalesce(
              json_agg(json_build_object('storage_key', i.storage_key, 'thumb_key', i.thumb_key)
                       order by i.id)
              filter (where i.id is not null),
              '[]'
            ) as images,
            (select count(*) - 1 from posts px where px.thread_id = t.id and px.deleted_at is null) as replies
     from threads t
     join lateral (
       select * from posts where thread_id = t.id and deleted_at is null order by id limit 1
     ) p on true
     left join images i on i.post_id = p.id
     where t.board_id = $1 and t.deleted_at is null
     group by t.id, t.subject, t.locked, t.bumped_at,
              p.id, p.body, p.author_label, p.created_at, p.hidden
     order by t.bumped_at desc
     limit 50`,
    [board.id],
  );

  return (
    <main>
      <div className="board-head">
        <div>
          <h1>
            /{board.slug}/ - {boardName(board, lang)}
          </h1>
          <p className="muted">{boardDescription(board, lang)}</p>
        </div>
        <NewThreadModal
          slug={board.slug}
          labels={{
            create: t.board.createThread,
            newThread: t.board.newThread,
            subject: t.board.subject,
            comment: t.board.comment,
            image: t.board.image,
            post: t.board.postThread,
            cancel: t.admin.cancel,
          }}
        />
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {threads.map((th) => (
        <div className="thread" key={th.thread_id}>
          <h3>
            <Link href={`/b/${board.slug}/${th.thread_id}`}>{th.subject}</Link>
            {th.locked ? t.board.locked : ""}
          </h3>
          <Post post={th as PostRow} backPath={`/b/${board.slug}`} isAdmin={user.isAdmin} />
          <Link href={`/b/${board.slug}/${th.thread_id}`}>
            {t.board.replies(Number(th.replies))}
          </Link>
        </div>
      ))}
      {threads.length === 0 && <p className="muted">{t.board.noThreads}</p>}
    </main>
  );
}
