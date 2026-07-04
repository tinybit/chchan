import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n";
import { registerWithInvite } from "@/lib/actions";
import { Hero } from "@/components/Hero";
import { SubmitButton } from "@/components/SubmitButton";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, { error }, t, user] = await Promise.all([
    params,
    searchParams,
    getT(),
    getSessionUser(),
  ]);
  if (user) redirect("/");

  const { rows } = await db.query(
    "select 1 from invites where token = $1 and used_at is null and expires_at > now()",
    [token],
  );
  const valid = rows.length > 0;

  return (
    <div className="login-page">
      <Hero />
      <div className="login-box">
        {!valid ? (
          <div className="error">{t.errors.badInvite}</div>
        ) : (
          <>
            <h2>{t.auth.joinTitle}</h2>
            <p className="muted">{t.auth.joinIntro}</p>
            {error && <div className="error">{error}</div>}
            <form className="cred-form" action={registerWithInvite}>
              <input type="hidden" name="token" value={token} />
              <input name="username" type="text" placeholder={t.auth.username} required />
              <input name="password" type="password" placeholder={t.auth.password} required />
              <SubmitButton>{t.auth.register}</SubmitButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
