const ERRORS: Record<string, string> = {
  oauth: "Sign-in failed. Try again.",
  domain: "This Google account cannot sign in here.",
  banned: "Access denied.",
};

// Deliberately blank: this is the only page the outside world can see,
// so it explains nothing about what is behind it.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const devAuth = process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_AUTH === "1";

  return (
    <div className="login-box">
      <h1>ChChan</h1>
      {error && <div className="error">{ERRORS[error] ?? "Error."}</div>}
      <p>
        <a className="btn" href="/api/auth/google">
          Sign in with Google
        </a>
      </p>
      {devAuth && (
        <form action="/api/auth/dev-login" method="get">
          <label className="muted" htmlFor="email">
            dev login (local only)
          </label>
          <br />
          <input id="email" name="email" type="text" placeholder="someone@clickhouse.com" />
          <button type="submit">dev login</button>
        </form>
      )}
    </div>
  );
}
