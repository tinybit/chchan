import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "ChChan",
  description: "Membership-gated anonymous board. Unofficial.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const approved = user?.status === "approved";
  const boards = approved
    ? (await db.query("select slug, name from boards order by position, id")).rows
    : [];

  // Outsiders get a bare page: no nav, no board names, no hints.
  return (
    <html lang="en">
      <body>
        <header className="site">
          <Link href="/" className="logo">
            ChChan
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
            {approved && <Link href="/rules">rules</Link>}
            {approved && user?.isAdmin && <Link href="/admin">admin</Link>}
            {user && (
              <form action="/api/auth/logout" method="post" style={{ display: "inline" }}>
                <button className="linkish" type="submit">
                  logout
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
