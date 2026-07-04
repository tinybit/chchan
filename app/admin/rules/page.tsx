import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { RulesEditors } from "@/components/RulesEditors";

export default async function RulesAdminPage() {
  const user = await getSessionUser();
  if (user?.role !== "root") redirect("/admin/approvals");
  const t = await getT();

  const { rows } = await db.query("select key, html from site_content where key like 'rules_%'");
  const content = Object.fromEntries(rows.map((r) => [r.key, r.html])) as Record<string, string>;

  return (
    <RulesEditors
      saveLabel={t.admin.save}
      versions={[
        { key: "rules_ru", label: "RU", html: content.rules_ru ?? "" },
        { key: "rules_en", label: "EN", html: content.rules_en ?? "" },
      ]}
    />
  );
}
