import { banAuthorOfPost, deletePost, hidePost, reportPost } from "@/lib/actions";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n";
import { publicUrl } from "@/lib/storage";
import { PostImage } from "./PostImage";
import { ReplyLink } from "./ReplyLink";

export type PostRow = {
  id: string;
  body: string;
  author_label: string;
  created_at: Date;
  hidden: boolean;
  storage_key: string | null;
  thumb_key: string | null;
};

/** Turns >>123 into an anchor link to post 123 on the same page. */
function lineParts(line: string, lineIdx: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = />>(\d+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    parts.push(
      <a key={`${lineIdx}-${m.index}`} className="quote-link" href={`#p${m[1]}`}>
        {m[0]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts.length > 0 ? parts : ["\u00a0"];
}

function Body({ text }: { text: string }) {
  return (
    <div className="post-body">
      {text.split("\n").map((line, i) => {
        const green = line.startsWith(">") && !line.startsWith(">>");
        const parts = lineParts(line, i);
        return (
          <div key={i}>{green ? <span className="greentext">{parts}</span> : parts}</div>
        );
      })}
    </div>
  );
}

export async function Post({
  post,
  backPath,
  isAdmin,
  canReply = false,
}: {
  post: PostRow;
  backPath: string;
  isAdmin: boolean;
  canReply?: boolean;
}) {
  const t = await getT();
  const hiddenForUser = post.hidden && !isAdmin;
  return (
    <div className="post" id={`p${post.id}`}>
      <div className="post-meta">
        <span className="label">
          {t.post.anon} {post.author_label}
        </span>{" "}
        {formatDate(post.created_at)} No.{post.id}
        {post.hidden && isAdmin && <b>{t.post.hiddenTag}</b>}{" "}
        <form action={reportPost} style={{ display: "inline" }}>
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="reason" value="report" />
          <input type="hidden" name="backPath" value={backPath} />
          <button className="linkish" type="submit">
            {t.post.report}
          </button>
        </form>
        {canReply && (
          <>
            {" "}
            <ReplyLink postId={post.id} label={t.post.reply} />
          </>
        )}
        {isAdmin && (
          <>
            {" "}
            <form action={hidePost} style={{ display: "inline" }}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="backPath" value={backPath} />
              <button className="linkish" type="submit">
                {post.hidden ? t.post.unhide : t.post.hide}
              </button>
            </form>{" "}
            <form action={deletePost} style={{ display: "inline" }}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="backPath" value={backPath} />
              <button className="linkish" type="submit">
                {t.post.del}
              </button>
            </form>{" "}
            <form action={banAuthorOfPost} style={{ display: "inline" }}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="backPath" value={backPath} />
              <button className="linkish" type="submit">
                {t.post.banAuthor}
              </button>
            </form>
          </>
        )}
      </div>
      {hiddenForUser ? (
        <div className="muted">{t.post.hiddenByMods}</div>
      ) : (
        <>
          {post.thumb_key && post.storage_key && (
            <div className="post-img">
              <PostImage
                thumbSrc={publicUrl(post.thumb_key)}
                fullSrc={publicUrl(post.storage_key)}
              />
            </div>
          )}
          <Body text={post.body} />
        </>
      )}
    </div>
  );
}
