import { banAuthorOfPost, deletePost, hidePost, reportPost } from "@/lib/actions";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n";
import { publicUrl } from "@/lib/storage";
import { PostImage } from "./PostImage";

export type PostRow = {
  id: string;
  body: string;
  author_label: string;
  created_at: Date;
  hidden: boolean;
  storage_key: string | null;
  thumb_key: string | null;
};

function Body({ text }: { text: string }) {
  return (
    <div className="post-body">
      {text.split("\n").map((line, i) => (
        <div key={i}>
          {line.startsWith(">") ? <span className="greentext">{line}</span> : line || "\u00a0"}
        </div>
      ))}
    </div>
  );
}

export async function Post({
  post,
  backPath,
  isAdmin,
}: {
  post: PostRow;
  backPath: string;
  isAdmin: boolean;
}) {
  const t = await getT();
  const hiddenForUser = post.hidden && !isAdmin;
  return (
    <div className="post" id={`p${post.id}`}>
      <div className="post-meta">
        <span className="label">{post.author_label}</span>{" "}
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
