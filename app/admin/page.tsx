import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import {
  approveUser,
  banAuthorOfPost,
  banUser,
  deletePost,
  hidePost,
  resolveReport,
  setAdminRole,
} from "@/lib/actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user?.isAdmin) redirect("/");
  const { error } = await searchParams;

  const { rows: pending } = await db.query(
    "select id, email, created_at from users where status = 'pending' order by created_at",
  );
  const { rows: reports } = await db.query(
    `select r.id, r.reason, r.created_at, p.id as post_id, p.body, p.hidden, p.author_label
     from reports r join posts p on p.id = r.post_id
     where r.resolved_at is null and p.deleted_at is null
     order by r.created_at`,
  );
  const { rows: actions } = await db.query(
    `select m.action, m.target_kind, m.target_id, m.note, m.created_at, u.email
     from mod_actions m join users u on u.id = m.admin_id
     order by m.id desc limit 30`,
  );
  const { rows: members } =
    user.role === "root"
      ? await db.query(
          `select id, email, role, status from users
           where status <> 'pending' order by role desc, email`,
        )
      : { rows: [] };

  return (
    <main>
      <h1>Admin</h1>
      {error && <div className="error">{error}</div>}

      <h2>Pending approvals ({pending.length})</h2>
      {pending.length === 0 && <p className="muted">Queue is empty.</p>}
      {pending.length > 0 && (
        <table className="admin">
          <thead>
            <tr>
              <th>Email</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{formatDate(u.created_at)}</td>
                <td>
                  <form action={approveUser} style={{ display: "inline" }}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit">approve</button>
                  </form>{" "}
                  <form action={banUser} style={{ display: "inline" }}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit">reject</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Open reports ({reports.length})</h2>
      {reports.length === 0 && <p className="muted">Nothing reported.</p>}
      {reports.map((r) => (
        <div className="post" key={r.id}>
          <div className="post-meta">
            <span className="label">{r.author_label}</span> post No.{r.post_id}
            {r.hidden && <b> [hidden]</b>} &mdash; reported{" "}
            {formatDate(r.created_at)}
          </div>
          <div className="post-body">{String(r.body).slice(0, 500)}</div>
          <form action={hidePost} style={{ display: "inline" }}>
            <input type="hidden" name="postId" value={r.post_id} />
            <input type="hidden" name="backPath" value="/admin" />
            <button type="submit">{r.hidden ? "unhide" : "hide"}</button>
          </form>{" "}
          <form action={deletePost} style={{ display: "inline" }}>
            <input type="hidden" name="postId" value={r.post_id} />
            <input type="hidden" name="backPath" value="/admin" />
            <button type="submit">delete</button>
          </form>{" "}
          <form action={banAuthorOfPost} style={{ display: "inline" }}>
            <input type="hidden" name="postId" value={r.post_id} />
            <button type="submit">ban author</button>
          </form>{" "}
          <form action={resolveReport} style={{ display: "inline" }}>
            <input type="hidden" name="reportId" value={r.id} />
            <button type="submit">resolve</button>
          </form>
        </div>
      ))}

      {user.role === "root" && (
        <>
          <h2>Members</h2>
          <table className="admin">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.email}</td>
                  <td>{m.role}</td>
                  <td>{m.status}</td>
                  <td>
                    {m.role !== "root" && m.status === "approved" && (
                      <>
                        <form action={setAdminRole} style={{ display: "inline" }}>
                          <input type="hidden" name="userId" value={m.id} />
                          <input
                            type="hidden"
                            name="makeAdmin"
                            value={m.role === "admin" ? "0" : "1"}
                          />
                          <button type="submit">
                            {m.role === "admin" ? "demote to member" : "make admin"}
                          </button>
                        </form>{" "}
                        <form action={banUser} style={{ display: "inline" }}>
                          <input type="hidden" name="userId" value={m.id} />
                          <button type="submit">ban</button>
                        </form>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Recent moderation actions</h2>
      <table className="admin">
        <thead>
          <tr>
            <th>When</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Target</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((a, i) => (
            <tr key={i}>
              <td>{formatDate(a.created_at)}</td>
              <td>{a.email}</td>
              <td>{a.action}</td>
              <td>
                {a.target_kind} {a.target_id}
              </td>
              <td>{a.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
