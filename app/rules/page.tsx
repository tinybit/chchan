import { guardMember } from "@/lib/guard";
import { acceptRules } from "@/lib/actions";

export default async function RulesPage() {
  const user = await guardMember();

  return (
    <main style={{ maxWidth: 720 }}>
      <h1>Rules and the honest fine print</h1>

      <h2>What this is</h2>
      <p>
        An unofficial anonymous board for ClickHouse folks, run as a pet project. It is not a
        company system, not endorsed by anyone, and not moderated by HR.
      </p>

      <h2>How anonymity works here</h2>
      <ul>
        <li>Google sign-in is used once, to verify you are @clickhouse.com and approve you.</li>
        <li>
          Posts are <b>not</b> linked to your account. The database stores no author id on posts
          &mdash; only a per-thread anonymous label derived from a keyed hash.
        </li>
        <li>Admins have no &ldquo;who wrote this&rdquo; button and no routine way to find out.</li>
        <li>Uploaded images are re-encoded and all metadata (EXIF, GPS) is stripped.</li>
        <li>No IP addresses or user agents are written to the application database.</li>
      </ul>

      <h2>The honest limits</h2>
      <ul>
        <li>
          This runs on commercial hosting (Vercel, Neon). Infrastructure providers keep standard
          request logs outside our control. The threat model protects you from coworkers and from
          the operator &mdash; not from subpoenas or a platform compromise.
        </li>
        <li>
          There is exactly one deliberate deanonymization path: if a post is serious abuse, an
          admin can recompute the hash against the member list to ban the author. Every use of it
          is permanently logged and visible in the moderation log.
        </li>
        <li>Writing style is a fingerprint. The site cannot protect you from yourself.</li>
      </ul>

      <h2>Rules</h2>
      <ol>
        <li>No harassment or threats against real people.</li>
        <li>No confidential company data: no customer info, credentials, or unreleased numbers.</li>
        <li>No illegal content. This gets the whole site killed instantly.</li>
        <li>No deanonymization attempts against other posters.</li>
        <li>Shitposting is fine. That is what this place is for.</li>
      </ol>

      <h2>Escalation</h2>
      <p>
        Threats, doxxing, confidential leaks, or illegal content: the post comes down first,
        questions after. Everything else: report it and the mods will look when they look.
      </p>

      {!user.rulesAccepted && (
        <form action={acceptRules}>
          <button type="submit">I have read the rules, let me in</button>
        </form>
      )}
    </main>
  );
}
