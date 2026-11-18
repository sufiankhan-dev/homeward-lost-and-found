# Homeward: Campus Lost & Found

A usable, accessible and responsive Lost & Found platform for a university or community, built as an HCI project. People can report lost or found items, search recent reports, and reconnect safely, without exposing personal contact details.

The interface deliberately applies Norman's design principles, Nielsen's heuristics, Shneiderman's golden rules, and the laws of Miller, Fitts, Hick-Hyman, Power Law of Practice and Pareto. **See [`docs/HCI.md`](docs/HCI.md)** for exactly where each one is implemented.

---

## Features

| Area | What you can do |
|---|---|
| Home | Clear purpose, prominent **Report Lost Item** / **Report Found Item**, search, recent items, popular categories, how it works, FAQ, Google Translate selector, footer links |
| Browse & search | Keyword search (full-text + partial matches), filters for Lost/Found, category, location, date range and status, removable filter chips, sort (newest, oldest, best match), pagination, loading/empty states, "/" shortcut |
| Report an item | Separate lost and found flows; 4-step guided form with hints, inline validation, error summary, autosaved draft, review step and confirmation; up to 3 photos with upload progress |
| Item details | Photos, labelled type and status, date, location, category; the owner sees private notes and management actions |
| Safe contact | Claim or contact requests through the site; found items require a private identifying detail; the finder accepts or declines; private message thread; withdraw requests |
| Dashboard | Overview counters, lost items, found items, requests (received and sent), reunited reports, activity feed with unread markers, profile settings (name, password) |
| Manage reports | Edit, mark reunited, close and reopen (with Undo), delete (with confirmation) |
| Moderation | Users flag listings; moderators hide, restore, close, mark duplicates or dismiss flags, with a recorded reason and an audit log |
| Help chatbot | Available on every page; answers from approved FAQ content, checks the real database for "I lost my …" questions, links to pages; optional Claude AI mode; FAQ fallback |
| Translation | Official Google Website Translator (native, keyboard-accessible select), "Show original", machine-translation notice on user-written text |

## Tech stack

- **Next.js 16** (App Router, server components, server actions) and **TypeScript** (strict)
- **Tailwind CSS v4** and **shadcn/ui** (Radix primitives)
- **Better Auth** (email and password; role field for moderators)
- **PostgreSQL** via **Drizzle ORM**:
  - **Neon** (`@neondatabase/serverless`) when `DATABASE_URL` is set
  - **PGlite** (embedded Postgres stored in `.data/pglite`) when it isn't, so the app runs with zero setup
- **Zod** validation shared by client and server; **React Hook Form** for the report wizard
- **sharp** for image validation and re-encoding (strips EXIF/GPS)
- **Anthropic SDK** (optional) for the AI chatbot
- **Vitest** unit tests and **Playwright** end-to-end tests

## Getting started

Requirements: Node.js 20+ (tested on Node 24) and npm.

```bash
npm install
npm run setup     # creates .env.local with a generated secret, migrates and seeds the local database
npm run dev       # http://localhost:3000
```

### Demo accounts (demo data only)

| Email | Role |
|---|---|
| `alex@demo.homeward.test` | user |
| `sam@demo.homeward.test` | user |
| `moderator@demo.homeward.test` | moderator |

Password for all demo accounts: `homeward-demo-1`. Demo data lives in `scripts/seed-data.ts`. It isn't loaded when `NODE_ENV=production` unless you pass `--allow-production`.

### Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run lint` / `typecheck` | ESLint and `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run build && npm run test:e2e` | End-to-end tests (Playwright; isolated database in `.data-test`) |
| `npm run db:generate` | Generate a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` / `db:seed` / `db:reset` | Apply migrations / add demo data / replace demo data |

First-time Playwright setup: `npx playwright install chromium`.

## Environment variables

Copy `.env.example` to `.env.local` (`npm run setup` does this for you).

| Variable | Required | Description |
|---|---|---|
| `BETTER_AUTH_SECRET` | yes | Long random string used to sign sessions |
| `BETTER_AUTH_URL` | yes | Public base URL, e.g. `http://localhost:3000` |
| `DATABASE_URL` | production | Neon connection string. Empty means local PGlite |
| `ADMIN_EMAILS` | no | Comma-separated emails that get the moderator role on sign-up |
| `ANTHROPIC_API_KEY` | no | Enables the AI chatbot (server only). Without it, the FAQ engine answers |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | no | Support email shown on the Contact page |
| `PGLITE_DIR`, `UPLOAD_DIR` | no | Override local storage folders |

### Using Neon

1. Create a Neon project and copy the pooled connection string into `DATABASE_URL`.
2. Run `npm run db:migrate`, then `node --import tsx scripts/seed.ts --categories-only` (or `npm run db:seed` for demo data).

## Architecture

```
src/
  app/                    Routes (server components by default)
    api/auth/[...all]     Better Auth handler
    api/uploads           Photo upload (auth, rate limit, signature check, re-encode)
    api/images/[id]       Access-checked image serving
    api/chat              Chatbot endpoint (validation, rate limit)
    browse, items/[id], report/{lost,found}, dashboard/*, admin, help, privacy, contact, sign-in, sign-up
  components/             UI: layout, items, report wizard, search, chat, translate, dashboard, admin, ui (shadcn)
  db/                     Drizzle schema, driver selection (Neon or PGlite)
  lib/
    items|claims|admin|profile/actions.ts   Server actions (validate → authorize → mutate → log)
    */queries.ts          Server-only reads (public queries never select private fields)
    chat/                 Knowledge base, FAQ engine, AI responder
    validation.ts         Zod schemas shared by client and server
    session.ts            getCurrentUser / requireUser / requireAdmin
drizzle/                  SQL migrations
scripts/                  migrate, seed, setup-env, e2e server
tests/unit, tests/e2e     Vitest and Playwright
docs/HCI.md               HCI principles → implementation map
```

### Database

| Table | Purpose |
|---|---|
| `user`, `session`, `account`, `verification` | Better Auth (with `role`) |
| `category` | Item categories (slug, icon, order) |
| `item_report` | Lost/found report: type, title, description, category, location, event date, public features, **private verification details**, contact preference, status (`OPEN`/`PENDING`/`RESOLVED`/`CLOSED`), visibility, duplicate link |
| `item_image` | Photo metadata and storage keys (files stored outside the database) |
| `claim_request` | Request from a user about a report (unique per user and report), status (`PENDING`/`ACCEPTED`/`DECLINED`/`WITHDRAWN`) |
| `claim_message` | Private messages within a request |
| `listing_flag` | User reports of problematic listings |
| `moderation_record` | Moderator actions with reasons (audit log) |
| `activity_event` | Per-user activity feed and unread counter |

Foreign keys use cascading or `set null` deletes as appropriate. Indexes cover browse filters (visibility, status, created date, type, category, event date), a GIN full-text index, and the user and claim lookups.

## Security and privacy

- Every mutation validates input with Zod on the server and checks ownership or role. Hidden UI is never the only protection.
- Public queries use an explicit column list: emails and private verification details are never selected for public pages.
- Phone numbers and emails are rejected in public listing text.
- Uploads: auth required, rate-limited, 5 MB limit, file type detected from content (not extension), dimension limits, re-encoded to WebP (metadata stripped), served through an access-checked route.
- Rate limits on sign-in and sign-up (Better Auth), report creation, requests, messages, uploads, flags and chat (in-memory; use a shared store such as Redis when running several instances).
- React escapes all user content; no raw HTML rendering.
- Security headers (`nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).
- Secrets come only from environment variables; `.env*` files are git-ignored.

## Known limitations

- **Google Translate:** the official Website Translator widget is a legacy Google product. It requires network access to `translate.google.com`. When unavailable, the selector shows "Translation unavailable right now" instead of a broken control.
- **Image storage** uses local disk (`.data/uploads`). For serverless hosting, implement the three functions in `src/lib/storage.ts` against an object store (S3, R2, Vercel Blob).
- **Email notifications** aren't sent; updates appear in the dashboard activity feed.
- Unattached uploads (photos uploaded but never submitted) are kept until cleaned up; a scheduled cleanup job would remove them.
