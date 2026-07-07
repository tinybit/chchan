import { getT } from "@/lib/i18n";
import { loginWithPassword } from "@/lib/actions";
import { Hero } from "@/components/Hero";
import { SubmitButton } from "@/components/SubmitButton";

// Deliberately blank: this is the only page the outside world can see,
// so it explains nothing about what is behind it.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getT();
  const devAuth = process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_AUTH === "1";

  return (
    <div className="login-page">
      <Hero />
      <div className="login-box">
        {error && <div className="error">{t.login.errors[error] ?? t.login.errors.generic}</div>}
        <p>
          <a className="btn" href="/api/auth/google">
            {t.login.signIn}
          </a>
        </p>
        <details className="invite-login">
          <summary>{t.auth.orInvite}</summary>
          <form className="cred-form" action={loginWithPassword}>
            <input name="username" type="text" placeholder={t.auth.username} required />
            <input name="password" type="password" placeholder={t.auth.password} required />
            <SubmitButton>{t.auth.login}</SubmitButton>
          </form>
        </details>
        {devAuth && (
          <form className="dev-login" action="/api/auth/dev-login" method="get">
            <label className="muted" htmlFor="email">
              {t.login.devLogin}
            </label>
            <input id="email" name="email" type="text" placeholder="anon@example.com" />
            <button type="submit">dev login</button>
          </form>
        )}
      </div>
      <p className="source-link">
        <a href="https://github.com/tinybit/chchan" target="_blank" rel="noopener noreferrer">
          {t.login.sourceCode}
        </a>
      </p>
    </div>
  );
}
