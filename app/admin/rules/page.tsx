import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { saveSiteContent } from "@/lib/actions";
import { RichEditor } from "@/components/RichEditor";

export default async function RulesAdminPage() {
  const user = await getSessionUser();
  if (user?.role !== "root") redirect("/admin/approvals");
  const t = await getT();

  const { rows } = await db.query("select key, html from site_content where key like 'rules_%'");
  const content = Object.fromEntries(rows.map((r) => [r.key, r.html])) as Record<string, string>;

  return (
    <>
      {(["rules_ru", "rules_en"] as const).map((key) => (
        <form key={key} action={saveSiteContent} className="content-edit">
          <h2>{key === "rules_ru" ? t.admin.rulesRu : t.admin.rulesEn}</h2>
          <input type="hidden" name="key" value={key} />
          <RichEditor name="html" initialHtml={content[key] ?? ""} />
          <button type="submit">{t.admin.save}</button>
        </form>
      ))}
    </>
  );
}
