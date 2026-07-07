import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { banUser, setAdminRole, unbanUser } from "@/lib/actions";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role !== "root") redirect("/admin/approvals");
  const { error } = await searchParams;
  const t = await getT();

  const { rows: members } = await db.query(
    `select id, coalesce(email, username) as identifier, role, status from users
     where status <> 'pending'
     order by case role when 'root' then 0 when 'admin' then 1 else 2 end,
              coalesce(email, username)`,
  );

  return (
    <>
      {error && <div className="error">{error}</div>}
      <table className="admin">
        <thead>
          <tr>
            <th>{t.admin.userCol}</th>
            <th>{t.admin.role}</th>
            <th>{t.admin.status}</th>
            <th>{t.admin.actions}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.identifier}</td>
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
                        {m.role === "admin" ? t.admin.demote : t.admin.makeAdmin}
                      </button>
                    </form>{" "}
                    <form action={banUser} style={{ display: "inline" }}>
                      <input type="hidden" name="userId" value={m.id} />
                      <input type="hidden" name="backPath" value="/admin/members" />
                      <button type="submit">{t.admin.ban}</button>
                    </form>
                  </>
                )}
                {m.status === "banned" && (
                  <form action={unbanUser} style={{ display: "inline" }}>
                    <input type="hidden" name="userId" value={m.id} />
                    <button type="submit">{t.admin.unban}</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
