# Journal

A private daily journal: one rich-text entry per calendar day, an optional
mood, searchable history, and a nightly push reminder if today's entry hasn't
been written. App #2 of the personal suite — it mirrors the
[Todo](https://github.com/KeeganBotha/todo) repo's structure and conventions.

## Stack

Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Postgres + Prisma ·
Better Auth (Google OAuth) · Zod · react-hook-form · Tiptap · web-push

## Getting started

1. **Env vars** — copy `.env.example` to `.env` and fill it in:
   - `DATABASE_URL` — a Postgres connection string (local Postgres or a free
     [Prisma Postgres](https://console.prisma.io) database)
   - `DIRECT_DATABASE_URL` — optional non-pooled URL for migrations
     (falls back to `DATABASE_URL`)
   - `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
   - `BETTER_AUTH_URL` — `http://localhost:3000` in development
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — an OAuth client from
     [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
     with `http://localhost:3000/api/auth/callback/google` as an authorized
     redirect URI
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — run
     `npx web-push generate-vapid-keys` once; the subject is a `mailto:` address
   - `CRON_SECRET` — any long random string; Vercel sends it as a bearer
     token to the reminder cron route
   - `APP_TIMEZONE` — an IANA name such as `Africa/Johannesburg`; every
     "today" in the app is computed in it
2. `npm install`
3. `npm run db:migrate` — applies migrations and generates the Prisma client
4. `npm run dev`

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run check` | eslint + tsc (CI runs this on every push/PR) |
| `npm run build` | prisma generate → migrate deploy → next build (what Vercel runs) |
| `npm run db:migrate` | create/apply migrations in development |
| `npm run db:studio` | browse the database |
| `node scripts/generate-icons.mjs` | re-render the app icon (SVG lives in the script) to `public/icons`, `src/app/apple-icon.png`, `src/app/icon.png` |

## Structure

Every feature follows action → service → provider; providers are the only
files that touch the database, and every query is scoped to the session's
user. Feature folders live under `src/app/(app)/<feature>/` with `_data/`
(schemas, service, provider) and `_components/`; shared components live in
`src/components/`. ESLint enforces the boundaries: `process.env` is only
readable in `src/lib/server/config.ts`, and the Prisma client is only
importable from providers.

The full conventions (architecture, security, UI) and the app spec live in
project docs kept outside the repo.

## Reminders (web push)

Settings → "Remind me at night" subscribes the current browser; the nightly
cron (`vercel.json`, 19:00 UTC = 21:00 SAST) pushes to every subscription
whose owner has no entry for today in `APP_TIMEZONE`. Push needs HTTPS or
`localhost`; on iPhone it only works from the installed Home Screen app.

Subscriptions are pruned two ways: the cron deletes any the push service
reports gone (404/410), and any not seen for `STALE_AFTER_DAYS` (60). An open
app touches its subscription once a day (`KeepRemindersAlive`), so only
devices that have vanished expire. Turning the toggle on always subscribes
fresh — iOS keeps a dead registration across a Home Screen reinstall. Test
the cron locally with:

```
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
```

## Deployment

Pushing `main` deploys via Vercel's Git integration: the build regenerates the
Prisma client and applies pending migrations against the production database.
After a schema change, restart your local dev server — a running server keeps
the previously generated Prisma client in memory.
