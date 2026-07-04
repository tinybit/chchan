import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n";

export default async function ModLogPage() {
  const t = await getT();
  const { rows: actions } = await db.query(
    `select m.action, m.target_kind, m.target_id, m.note, m.created_at, u.email
     from mod_actions m join users u on u.id = m.admin_id
     order by m.id desc limit 100`,
  );

  return (
    <table className="admin">
      <thead>
        <tr>
          <th>{t.admin.when}</th>
          <th>{t.admin.admin}</th>
          <th>{t.admin.action}</th>
          <th>{t.admin.target}</th>
          <th>{t.admin.note}</th>
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
  );
}
