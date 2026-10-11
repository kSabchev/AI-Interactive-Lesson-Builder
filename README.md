# AI Interactive Lesson Builder

A web app that turns a science topic into an interactive lesson and follow-up quiz for learners aged 8–12. An adult reviews the lesson, presents it on one shared screen with hands-on activities, and checks understanding with a quiz tied directly to what was taught.

## Status

The product is becoming a subscription SaaS for parents and teachers. The milestone plan, decisions and draft tiers are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

| Milestone | State |
| --- | --- |
| 1–3. Player, quiz and results, review editor with local persistence | ✅ |
| 4. AI generation | 🟡 Built and tested in sample mode; the live check with a real API key is still to do |
| 5. Accounts and cloud data | ✅ Magic-link sign-in (optional Google), lessons and quiz results saved to the account, guest import, account deletion |
| 6. Subscriptions and billing | ✅ Stripe Checkout and Customer Portal, webhook-synced plans, monthly AI lesson quotas, saved-lesson cap |
| 7. Evidence support | ✅ Reference text split into cited excerpts, optional web research (Pro) with sources taken only from search citations, sources shown in the player, quiz and editor |
| 8–9. Classroom tier, launch readiness | ⏳ |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

### Accounts and database

Nothing to set up locally: without `DATABASE_URL` the app uses an embedded Postgres (PGlite) in `.data/` and migrates it on first use. Sign-in links are written to `.data/mailbox.jsonl` and printed in the server console instead of being emailed. For production, set `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, and run `npm run db:migrate`; see `.env.example`. After changing `src/lib/server/db/schema.ts`, run `npm run db:generate` to create a migration.

Guests can use everything without an account; their lessons stay in the browser. Signing in saves lessons to the account and offers to move any browser lessons across.

### Billing (Stripe)

Billing is off until `STRIPE_SECRET_KEY` and a Pro price are set; until then everyone is on Free. Plans and limits live in `src/lib/billing/plans.ts`. To try it locally with Stripe test mode:

1. Create a "Pro" product with monthly and yearly recurring prices, and put their ids in `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_YEARLY`.
2. Run `stripe listen --forward-to localhost:3000/api/billing/webhook` and set `STRIPE_WEBHOOK_SECRET` to the secret it prints.
3. Enable the Customer Portal in the Stripe dashboard (Settings → Billing → Customer portal).

Live AI generation requires an account. Each plan has a monthly allowance (a high-quality lesson counts as two), reserved atomically before generating and given back if the service fails.

### AI generation

By default the app runs in **sample mode**: "Generate lesson" returns a clearly labelled copy of the closest curated lesson and makes no API call. To generate real lessons with Claude, copy `.env.example` to `.env.local` and set:

```bash
GENERATION_MODE=live
ANTHROPIC_API_KEY=sk-ant-...   # server-side only; set a spend limit in the Claude Console
```

API usage is billed to the Console account that owns the key, separately from any Claude subscription. Each model call logs its token usage and an estimated cost (`[generation] usage`) to the server console. `GENERATION_MODEL`, `GENERATION_EFFORT`, `GENERATION_HOURLY_LIMIT` and `GENERATION_DAILY_CAP` are optional; see `.env.example`.

| Script | Purpose |
| --- | --- |
| `npm test` | Unit tests (Vitest): lesson schema, scoring, activity checking, storage, generation pipeline and route |
| `npm run e2e` | Playwright journey tests on desktop and tablet viewports (builds the app first; always in sample mode) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## How it fits together

- **`src/lib/lesson/schema.ts`** — the lesson data model as Zod schemas. Sections are a discriminated union (`hook`, `explanation`, `prediction`, `diagram-labeling`, `sorting`, `recap`). Cross-reference checks make sure every quiz question points at a real objective, section and source, that each objective is covered by the quiz, and that diagrams and visuals come from the approved asset lists. The same schema validates AI output.
- **`src/lib/assets/`** — approved diagrams (with labelled target positions) and illustrations. Lessons reference assets by id, so topics without a matching diagram fall back to prediction and sorting activities.
- **`src/content/samples/`** — curated lessons, validated when loaded.
- **`src/lib/quiz/scoring.ts`, `src/lib/activities/checking.ts`** — pure logic for scoring and activity feedback, unit tested.
- **`src/components/sections/`** — one renderer per section type; `SectionView` dispatches on `type`.
- **`src/components/player/LessonPlayer.tsx`** — presentation player (←/→ or PageUp/PageDown to navigate, `F` for full screen, facilitator notes toggle).
- **`src/components/quiz/`** — quiz runner and results.
- **`src/lib/storage/db.ts`** — IndexedDB storage for saved lessons and the latest quiz attempt per lesson. Lessons are validated on write and re-validated on read.
- **`src/lib/generation/`** — staged generation pipeline (outline → content → quiz → check), each stage validated with Zod plus the lesson's cross-reference rules and repaired at most once by feeding the problems back to the model. The model writes content only; ids, section types, origin labels and sources are added in code, so it can't invent citations. `server/` holds the server-only Claude client, configuration and rate limits; `sample.ts` is the no-AI mode.
- **`src/lib/generation/evidence.ts`** — evidence as numbered excerpts: pasted reference text is split into `ref-N` excerpts, and web research turns the search tool's citations into `web-N` excerpts. Explanation sections and quiz questions must cite excerpt ids, the schema only accepts ids that exist, and a lesson's sources are exactly the excerpts it cites, with text and URLs copied from the evidence.
- **`src/app/api/lessons/generate/route.ts`** — validates and rate-limits the request, then streams progress as newline-delimited JSON. **`/create`** shows only the stages the server reports and keeps the form filled in on failure.
- **`src/lib/storage/store.ts`** — one `LessonStore` interface with two implementations: IndexedDB for guests and the account API for signed-in users. `StoreProvider` picks one from the session; the editor, player and library don't know which.
- **`src/lib/server/`** — server-only code: Drizzle schema and connection (`db/`), Better Auth setup (`auth.ts`), per-user lesson storage (`lessons.ts`, every query filtered by owner) and request helpers (`http.ts`: session check, same-origin check for writes, body size limits). API routes live under `src/app/api/`.
- **`src/lib/server/billing/`** — Stripe client and configuration, webhook handling (each event applied once, late or out-of-order events ignored), entitlements and the atomic monthly quota. Deleting an account cancels its subscription first.
- **`src/components/editor/`** — form-based review editor. Curated samples are read-only, so saving an edited sample creates a copy. A failed save lists each problem with a link to the field that needs fixing (`src/lib/lesson/issues.ts`).

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Motion and Zod.
