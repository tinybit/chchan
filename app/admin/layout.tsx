import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { AdminTabs } from "@/components/AdminTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user?.isAdmin) redirect("/");
  const t = await getT();

  const [pending, reports] = await Promise.all([
    db.query("select count(*)::int as n from users where status = 'pending'"),
    db.query(
      `select count(*)::int as n from reports r join posts p on p.id = r.post_id
       where r.resolved_at is null and p.deleted_at is null`,
    ),
  ]);

  const tabs = [
    { href: "/admin/approvals", label: `${t.admin.pendingApprovals} (${pending.rows[0].n})` },
    { href: "/admin/reports", label: `${t.admin.openReports} (${reports.rows[0].n})` },
    ...(user.role === "root"
      ? [
          { href: "/admin/members", label: t.admin.members },
          { href: "/admin/boards", label: t.admin.boardsSection },
        ]
      : []),
    { href: "/admin/log", label: t.admin.modLog },
  ];

  return (
    <main>
      <h1>{t.admin.title}</h1>
      <AdminTabs tabs={tabs} />
      {children}
    </main>
  );
}
