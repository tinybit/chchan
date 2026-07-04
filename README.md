# ChChan

A tiny, self-hostable anonymous imageboard for people who want their own private corner online — separate from the company they work at.

## Why this exists

Employees rarely have a place to speak openly. You can't always share a concern, vent a frustration, celebrate a small win, or just shitpost about something happening internally — not under your own name, not in a channel where a screenshot ties it back to you. Group chats feel safe until they aren't: names are attached, history is searchable, and "anonymous" usually means "anonymous until someone looks."

ChChan is a small answer to that. It's a membership-gated board where approved people can post **anonymously** — including about internal stuff, good or bad — without their posts being linked back to their identity, not even by the person running the site. Think of it as a quiet room your team can actually be honest in.

It is deliberately unofficial by nature: not an HR tool, not a company system, just a place people can talk.

## What it is

- An imageboard (threads, replies, images, greentext, `>>` quotes) with a classic look.
- Membership-gated: nothing is visible to the outside world except a sign-in button.
- Two ways in: Google sign-in restricted to a chosen email domain, or single-use invite links for people who'd rather not attach a personal Google account.
- Manual approval, a simple role system (root / admin / member), and lightweight moderation.
- Bilingual UI (English / Russian) with editable rules pages.

## How anonymity works

The core rule: **authentication proves you're allowed in — it is never linked to what you post.**

- Posts carry no author id. Instead each post stores a keyed hash (`HMAC(secret, user + thread)`), which produces a stable per-thread label like `Anon a1b2c3`. The same person looks like the same anon *within one thread*, and completely unrelated across different threads.
- Admins have no "who wrote this" button in normal operation. There is exactly one deliberate exception — an admin can recompute the hash across the member list to ban the author of an abusive post — and every use of it is written to a permanent moderation log.
- Uploaded images are re-encoded server-side, which strips all metadata (EXIF, GPS, device info).
- No IP addresses or user agents are written to the application database. Stale sessions and rate-limit counters are purged so they can't accumulate into an activity timeline.

Honest limits (also stated in the app's own rules page): it runs on commercial hosting, whose providers keep their own standard request logs outside the operator's control. The threat model protects you from your coworkers and from the operator — not from a subpoena or a platform compromise. And writing style is a fingerprint the software can't hide.

## Why it's built from scratch

There's plenty of existing imageboard software, but it tends to be huge and feature-heavy. This is intentionally the opposite: a small, readable codebase you can understand in an afternoon and change without fighting a framework. Plain SQL, no ORM, no unnecessary abstractions.

Take it, use it, self-host it, modify it to your heart's content. Do whatever you want with it.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL, accessed with plain SQL via `pg` — no ORM
- Google OAuth (hand-rolled) and scrypt password accounts via invite links
- Cloudflare R2 (or any S3-compatible storage) for images; local disk in development
- Deploys cleanly to Vercel + Neon; images to R2

## Running locally

Requirements: Node and a local PostgreSQL.

```bash
npm install
cp .env.example .env.local   # then fill in the values
createdb chchan
npm run migrate              # apply schema
node scripts/seed.mjs        # seed a few boards
npm run dev
```

Key environment variables (see `.env.example` for the full list):

- `DATABASE_URL` — Postgres connection string
- `APP_URL` — base URL of the app (used for OAuth redirects)
- `SESSION_SECRET`, `ANON_SECRET` — random 32-byte hex strings; `ANON_SECRET` keys the author hash, so rotating it permanently unlinks all past posts
- `ROOT_EMAIL` — the site owner's email (always admitted as root, exempt from the domain check)
- `ALLOWED_EMAIL_DOMAIN` — the Google Workspace domain allowed to sign in
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `R2_*` — Cloudflare R2 credentials for image storage (falls back to local disk when unset)

In development, set `DEV_FAKE_AUTH=1` to enable a local-only login box that skips Google. It returns 404 in any production build regardless of env.

## Deploying

Push to a Vercel project, provision a Neon Postgres database, set the environment variables above, run the migrations against the production database, and point your domain at Vercel. Add an R2 bucket and its credentials when you want image uploads. Before inviting people, move the Google OAuth consent screen from "Testing" to "Published" so any allowed-domain account can sign in.

## License

Do whatever you want with it.
