import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n";
import { approveUser, banUser } from "@/lib/actions";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getT();
  const { rows: pending } = await db.query(
    `select id, coalesce(email, username) as identifier, created_at
     from users where status = 'pending' order by created_at`,
  );

  return (
    <>
      {error && <div className="error">{error}</div>}
      {pending.length === 0 && <p className="muted">{t.admin.queueEmpty}</p>}
      {pending.length > 0 && (
        <table className="admin">
          <thead>
            <tr>
              <th>{t.admin.userCol}</th>
              <th>{t.admin.requested}</th>
              <th>{t.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((u) => (
              <tr key={u.id}>
                <td>{u.identifier}</td>
                <td>{formatDate(u.created_at)}</td>
                <td>
                  <form action={approveUser} style={{ display: "inline" }}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit">{t.admin.approve}</button>
                  </form>{" "}
                  <form action={banUser} style={{ display: "inline" }}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="backPath" value="/admin/approvals" />
                    <button type="submit">{t.admin.reject}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
