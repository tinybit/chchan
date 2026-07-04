import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLang, getT } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import { WatchIndicator } from "@/components/WatchIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "ChChan",
  description: "ChChan",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, lang, t, theme] = await Promise.all([
    getSessionUser(),
    getLang(),
    getT(),
    getTheme(),
  ]);
  const approved = user?.status === "approved";
  const boards = approved
    ? (
        await db.query(
          "select slug, name from boards where not archived order by position, id",
        )
      ).rows
    : [];

  // Outsiders get a bare page: no nav, no board names, no hints.
  return (
    <html lang={lang} data-theme={theme}>
      <body>
        <header className="site">
          <Link href="/" className="logo">
            {t.siteName}
          </Link>
          {approved && (
            <nav>
              {boards.map((b) => (
                <Link key={b.slug} href={`/b/${b.slug}`}>
                  /{b.slug}/
                </Link>
              ))}
            </nav>
          )}
          <span className="spacer" />
          <nav>
            {approved && <WatchIndicator label={t.watch.updates} emptyLabel={t.watch.none} />}
            <ThemeToggle initial={theme} />
            <a
              className={`flag${lang === "ru" ? " active" : ""}`}
              href="/api/lang?code=ru"
              title="Русский"
            >
              🇷🇺
            </a>
            <a
              className={`flag${lang === "en" ? " active" : ""}`}
              href="/api/lang?code=en"
              title="English"
            >
              🇺🇸
            </a>
            {approved && <Link href="/rules">{t.nav.rules}</Link>}
            {approved && user?.isAdmin && <Link href="/admin">{t.nav.admin}</Link>}
            {user && (
              <form action="/api/auth/logout" method="post" style={{ display: "inline" }}>
                <button className="linkish" type="submit">
                  {t.nav.logout}
                </button>
              </form>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
