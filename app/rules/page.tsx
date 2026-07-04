import { db } from "@/lib/db";
import { guardMember } from "@/lib/guard";
import { acceptRules } from "@/lib/actions";
import { getLang, getT } from "@/lib/i18n";

export default async function RulesPage() {
  const user = await guardMember();
  const [lang, t] = await Promise.all([getLang(), getT()]);

  // Content is root-authored HTML from the admin WYSIWYG editor; root is the
  // site operator, so rendering it unsanitized is an accepted trust boundary.
  const { rows } = await db.query("select html from site_content where key = $1", [
    lang === "ru" ? "rules_ru" : "rules_en",
  ]);
  const html = rows[0]?.html ?? "";

  return (
    <main style={{ maxWidth: 720 }}>
      <div className="rules-content" dangerouslySetInnerHTML={{ __html: html }} />
      {!user.rulesAccepted && (
        <form action={acceptRules}>
          <button type="submit">{t.rulesPage.accept}</button>
        </form>
      )}
    </main>
  );
}
