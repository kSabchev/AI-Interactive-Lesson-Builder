# AI Interactive Lesson Builder

A web app that turns a science topic into an interactive lesson and follow-up quiz for learners aged 8–12. An adult reviews the lesson, presents it on one shared screen with hands-on activities, and checks understanding with a quiz tied directly to what was taught.

## Status

The product is becoming a subscription SaaS for parents and teachers. The milestone plan, decisions, draft tiers and the agreed next steps are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). The next step is proving generation on 10–15 real topics before adding more features.

| Milestone | State |
| --- | --- |
| 1–3. Player, quiz and results, review editor with local persistence | ✅ |
| 4. AI generation | 🟡 Built and tested in sample mode; web research fixed after the first live run; a systematic live check on real topics is still to do |
| 5. Accounts and cloud data | ✅ Magic-link sign-in (optional Google), lessons and quiz results saved to the account, guest import, account deletion |
| 6. Subscriptions and billing | ✅ Stripe Checkout and Customer Portal, webhook-synced plans, monthly AI lesson quotas, saved-lesson cap |
| 7. Evidence support | ✅ Reference text split into cited excerpts, optional web research (Pro) with sources taken only from search citations, sources shown in the player, quiz and editor |
| Languages | ✅ English and Bulgarian interface; lessons written in the topic's language |
| 8. Classroom tier | ⏳ When there is demand |
| 9. Launch readiness | 🚧 CI, generation log, Resend sign-in email and a Render demo Blueprint done; security headers, accessibility checks, shared rate limits and legal pages to do |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

### Testing everything locally

1. `cp .env.example .env.local`, then set `GENERATION_MODE=live` and `ANTHROPIC_API_KEY` to try real AI generation. Leave `BETTER_AUTH_SECRET` and `EMAIL_TRANSPORT` empty: locally a built-in development secret is used and sign-in links go to the development mailbox.
2. Optionally set `DEV_PLAN_OVERRIDE=pro` to try Pro features (reference text, web research, high quality) without Stripe.
3. If `DATABASE_URL` points at a Postgres database, run `npm run db:migrate` after pulling changes that add migrations. The embedded database migrates itself.
4. `npm run dev` and open http://localhost:3000. Use `npm run dev` rather than `npm start` for local testing: the development mailbox only exists in development, and production mode needs a real secret and email provider before anyone can sign in.
5. Sign in with any email address. No email is sent: open **http://localhost:3000/dev/mailbox** (also linked after you request a link) and click **Open link**.
6. Create a lesson. Live generation needs an account, and each one is counted against the plan's monthly allowance.
7. Open the **generation log** (linked from the account page, or `/admin/generations`) to see what each lesson cost, stage by stage.

### Troubleshooting the dev server

- **The page reloads over and over:** the dev server's build cache is out of step, for example after switching branches. Stop the server, delete `.next/dev`, and run `npm run dev` again. (The end-to-end tests build into their own `.next-e2e` folder, so they no longer cause this.)
- **"Another next dev server is already running":** an earlier dev server is still running in the background, for example one started from another terminal or tool. Stop the `node` processes running `next` for this folder (Task Manager on Windows), then start again.
- **`/dev/mailbox` shows "not found":** the app is running in production mode (`npm start`), or `EMAIL_TRANSPORT` is set to something other than `file`.

### Accounts and database

Nothing to set up locally: without `DATABASE_URL` the app uses an embedded Postgres (PGlite) in `.data/` and migrates it on first use. Sign-in links are written to `.data/mailbox.jsonl` and printed in the server console instead of being emailed. For production, set `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, and run `npm run db:migrate`; see `.env.example`. After changing `src/lib/server/db/schema.ts`, run `npm run db:generate` to create a migration.

`EMAIL_SIGN_IN=false` hides email sign-in and refuses its endpoint, for a deployment whose email domain isn't verified yet; Google and demo sign-in still work. Sign-in emails go wherever `EMAIL_TRANSPORT` says: `file` (the default while developing) writes them to the local mailbox, and `resend` sends them through [Resend](https://resend.com) with `RESEND_API_KEY` and an `EMAIL_FROM` address on a domain verified there. In production with no transport set, sending fails with an error rather than pretending to deliver.

Guests can use everything without an account; their lessons stay in the browser. Signing in saves lessons to the account and offers to move any browser lessons across.

**Demo sign-in.** With `DEMO_SIGN_IN=true`, the sign-in page offers **Try the demo**, which creates a throwaway account with no email (Better Auth's anonymous accounts). With `DEMO_ACCESS_CODES` set, a comma-separated list, visitors need one of the codes; give each person or group their own, so one can be withdrawn by removing it. Codes are checked on the server, ignore case, and are limited to 5 tries a minute. A demo account:

- is on the Free plan and counts against the same hourly and daily limits;
- lives in one browser, and is lost when its owner signs out or clears the browser's data;
- can't subscribe, and never counts as an operator, whatever `ADMIN_EMAILS` says;
- keeps its lessons and quiz results if its owner later signs in with email or Google: they move to that account.

The development mailbox is never used for this: on a public site it would let anyone sign in as anyone.

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

API usage is billed to the Console account that owns the key, separately from any Claude subscription. Optional settings (see `.env.example`):

| Setting | Default | Purpose |
| --- | --- | --- |
| `GENERATION_MODEL_STANDARD` | `claude-sonnet-5-5` | Model for standard lessons |
| `GENERATION_MODEL_HIGH` | `claude-opus-5-5` | Model for the Pro "high quality" option, counted as two lessons |
| `GENERATION_EFFORT` | `medium` | How much the model thinks: `low` to `max` |
| `GENERATION_WEB_RESEARCH` | on | Set to `false` to stop offering web research |
| `GENERATION_HOURLY_LIMIT` | 5 | Live lessons per visitor per hour |
| `GENERATION_DAILY_CAP` | 50 | Live lessons per day across everyone; rebuilt from the database after a restart |

#### Choosing models

`GENERATION_MODEL_STANDARD` is used for every standard lesson; `GENERATION_MODEL_HIGH` for the Pro "high quality" option, which counts as two lessons. Any of these can go in either setting:

| Model | Price per million tokens (input / output) | Cost per lesson | Speed | Notes |
| --- | --- | --- | --- | --- |
| `claude-sonnet-5-5` | $2 / $10 | **$0.06–0.08 (measured)** | 30–45 s | **Default for standard lessons.** Good writing, reliable JSON, web research and the refusal fallback both work |
| `claude-opus-5-5` | $4 / $20 | ~$0.11–0.15 (estimated) | Slower | **Default for high quality.** Stronger reasoning and planning, about twice the cost of Sonnet |
| `claude-haiku-5-5` | $0.10 / $0.50 | ~$0.005 (estimated) | Fastest | About 20× cheaper, but untested for these lessons. **Web research fails with it** (its search tool version isn't supported), and it has no server-side refusal fallback |
| `claude-fable-5-1` | $10 / $50 | ~$0.30 (estimated) | Slowest | The most capable model; more than short lessons need |
| `claude-sonnet-5`, `claude-opus-5`, `claude-haiku-4-5` | $2/$10, $5/$25, $1/$5 | | | Older; no reason to choose them |

Where these numbers come from: a standard lesson is three calls (outline, content, quiz) of about 6,000 input and 4,400 output tokens in total, measured with Sonnet 5.5; the other costs apply each model's prices to the same token counts, so treat them as estimates until the generation log shows real ones. The generation log records the model and cost of every lesson, so a change can be checked against real lessons.

`GENERATION_EFFORT` sets how much the model thinks before answering. Keep `medium`. In an October 2026 test on 5 topics, `low` for the outline and quiz saved only about 4% and no consistent time, and made small mistakes (vaguer objectives, a wrong letter in a Bulgarian lesson). Higher levels cost more without a measured benefit.

**Web research** (Pro) runs Claude's web search before writing and keeps only the pages it cites. Each search costs about $0.01, with at most 5 per lesson. If it finds fewer than two usable sources, the lesson is still written as a draft without sources, and the editor says so, so the searches are not wasted.

**Generation log.** Each model call prints its tokens and estimated cost (`[generation] usage`) in the server console and is stored for the log at `/admin/generations`, linked from the account page. The log lists every request with its settings, model, outcome, tokens, cache use, web searches, estimated cost and time, and breaks each request down call by call: research, outline, content, quiz and any repairs. Lesson sections are written together in one call, so costs are shown per stage rather than per section. Estimates use list prices, including cache reads and writes; the Claude Console has the billed amounts. `ADMIN_EMAILS` (comma-separated) chooses who can see the log: while developing with it unset, any signed-in user can, and in production with it unset, nobody can.

### Languages

The interface is available in English and Bulgarian. The **EN / БГ** toggle in the header saves the choice in a `locale` cookie; without one, the browser's language decides. Server-rendered pages, API error messages, sign-in emails and Stripe Checkout all follow the same choice.

Each lesson has its own `language`, detected from the topic: a topic written mostly in Cyrillic produces a Bulgarian lesson, anything else an English one. The model is told to write every learner-facing word in that language, translating English sources if needed. The parts learners see (the lesson stage, the player controls, the quiz and its results, the editor preview) follow the lesson's language, while the adult's header and editor follow the interface language, so a Bulgarian lesson can be presented from an English interface and the other way round. The curated samples are English, and the Bulgarian interface text still needs a review by a native speaker.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server, with the development mailbox |
| `npm test` | Unit tests (Vitest): lesson schema, scoring, activity checking, storage, generation pipeline and route, billing, email, sign-in and the generation log |
| `npm run e2e` | Playwright journey tests on desktop and tablet viewports (builds the app first; always in sample mode) |
| `npm run typecheck` | TypeScript (generates Next.js route types first) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Create a migration after changing `src/lib/server/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the Postgres database in `DATABASE_URL` |

The end-to-end tests build the app into `.next-e2e` (`NEXT_DIST_DIR`), separate from the `.next` folder a running dev server uses.

### Privacy notice and error log

- **`/privacy`**, linked from the footer, says what the app stores, which services receive data (Anthropic, Render, Resend, Google, Stripe), which cookies it sets and how long data is kept. `CONTACT_EMAIL` adds an address for questions. Keep it in step with the code when what is stored or shared changes. It's a plain-language notice for the demo, not a legal policy for a public launch.
- **`/admin/errors`** (operators only, linked from the account page and the generation log) lists server errors from the last 30 days: errors Next.js catches in pages and API routes, unexpected sign-in failures (such as an email provider refusing to send) and generation failures. Each is also printed to the server log. Set `ERROR_ALERT_WEBHOOK_URL` to a Slack or Discord incoming webhook to get a message for each one, at most 10 an hour.

## Deploying a demo

`render.yaml` is a [Render Blueprint](https://render.com/docs/blueprint-spec) for a web service and a Postgres database. Database migrations run each time the service starts. Before deploying:

1. **Claude key:** in the Claude Console, create a workspace just for the demo, with a **monthly spend limit**, and a key in it. The spend limit is the hard cap; the app's own limits (`GENERATION_HOURLY_LIMIT`, `GENERATION_DAILY_CAP`, set low in the Blueprint) are a backstop. The daily count is rebuilt from the database after a restart, but the hourly limit lives in memory and resets on restart.
2. **Email:** create a [Resend](https://resend.com) account, verify a domain you own, and create an API key. Sign-in links are sent from `EMAIL_FROM` on that domain.
3. **Deploy:** in Render, choose New → Blueprint and point it at this repository. When asked, fill in `BETTER_AUTH_URL` (the service's public URL, such as `https://lesson-builder.onrender.com`), `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS` (your email, for the generation log), and for **Try the demo** `DEMO_SIGN_IN=true` with `DEMO_ACCESS_CODES` (set the codes first: with none, anyone can start a demo). Render generates `BETTER_AUTH_SECRET` and connects `DATABASE_URL`. Render asks for these values only when the Blueprint is first created; variables added to `render.yaml` later need entering under the service's **Environment**.
4. **Check:** sign in with your email, generate one lesson, and confirm it appears in the generation log with its cost.

Until the email domain is verified, set `EMAIL_SIGN_IN=false` so the sign-in page doesn't offer a form that fails. People can still sign in with **Google** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, redirect URI `https://<your-url>/api/auth/callback/google`) or **Try the demo** with an access code.

Notes:

- **Billing:** Stripe stays off unless its variables are set, so everyone is on the Free plan (3 AI lessons a month each). To demo Pro, add Stripe **test-mode** keys and a webhook endpoint (`/api/billing/webhook`) as described under Billing.
- **Free plans:** free web services sleep when idle and take a while to wake. Free Render Postgres databases are time-limited, so check Render's current terms, or use a paid plan or another Postgres provider through `DATABASE_URL`.
- **Privacy:** topics that people type are stored with their account. Say so on the demo, and don't use it with real pupils' data.

### The database on Render

Free Render Postgres databases **expire 30 days after they're created**, and are deleted after a further 14-day grace period, with every account, lesson and log entry. The database's page in Render shows the date. Before then, choose one:

1. **Upgrade it to a paid Render plan.** Nothing else changes. The simplest choice if the demo should keep its accounts.
2. **Move to a provider whose free tier doesn't expire**, such as Neon: back up, restore into the new database, then point `DATABASE_URL` at it (in `render.yaml`, replace the `fromDatabase` entry with `sync: false` and set the new URL).
3. **Let it go.** Create a new database and point `DATABASE_URL` at it; the app creates its tables on the next start. Everything stored so far is lost.

To back up or move the data you need the PostgreSQL client tools (`pg_dump`, `pg_restore`) and the **External Database URL** from the database's page in Render:

```bash
pg_dump --format=custom --no-owner "<external database URL>" --file lesson-builder.dump
pg_restore --no-owner --dbname "<new database URL>" lesson-builder.dump
```

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`: typecheck, lint and unit tests in one job, and the Playwright suite in another (it uploads the report and traces when something fails). CI needs no secrets: tests run in sample mode with an in-memory database and dummy billing values, so they never call a paid API.

## How it fits together

- **`src/lib/lesson/schema.ts`** — the lesson data model as Zod schemas. Sections are a discriminated union (`hook`, `explanation`, `prediction`, `myth-or-fact`, `diagram-labeling`, `sorting`, `sequence`, `matching`, `experiment`, `recap`). A `sequence` section stores its steps in the correct order and a `matching` section its pairs; the player shuffles steps and right-hand sides the same way every time, never already solved (`src/lib/activities/checking.ts`). Every activity works with taps or the keyboard, without dragging. Cross-reference checks make sure every quiz question points at a real objective, section and source, that each objective is covered by the quiz, and that diagrams and visuals come from the approved asset lists. The same schema validates AI output.
- **`src/lib/assets/`** — approved diagrams (with labelled target positions) and illustrations; the drawings are SVG components in `src/components/art/`. Nine diagrams: the water cycle, the solar system, photosynthesis, parts of a plant, the butterfly life cycle, states of matter, phases of the Moon, a food chain and a simple circuit. Lessons reference assets by id, so topics without a matching diagram use another activity. To add a diagram: draw it (800×500, no text labels), add its metadata and target spots to `diagrams.ts`, register the drawing in `components/art/diagrams.tsx`, and add its English and Bulgarian spot descriptions; `diagrams.test.ts` checks it's complete and that its target buttons don't overlap.
- **`src/content/samples/`** — curated lessons, validated when loaded.
- **`src/lib/quiz/scoring.ts`, `src/lib/activities/checking.ts`** — pure logic for scoring and activity feedback, unit tested.
- **`src/components/sections/`** — one renderer per section type; `SectionView` dispatches on `type`.
- **`src/components/player/LessonPlayer.tsx`** — presentation player (←/→ or PageUp/PageDown to navigate, `F` for full screen, facilitator notes toggle).
- **`src/components/quiz/`** — quiz runner and results.
- **`src/lib/storage/db.ts`** — IndexedDB storage for saved lessons and the latest quiz attempt per lesson. Lessons are validated on write and re-validated on read.
- **`src/lib/generation/`** — staged generation pipeline (outline → content → quiz → check). The warm-up (section 2) is "myth or fact?" when children commonly hold misconceptions about the topic, otherwise a prediction. Every lesson also has two activities, chosen by the shape of the topic (`chosenPlan` in `stages.ts`). **Do it**, after the first explanation: a hands-on experiment when the adult ticks "Include a hands-on experiment"; otherwise label an approved diagram if one fits, put steps in order (a process), match pairs (one-to-one facts) or a second prediction. **Apply it**, after the second: sort into groups (a classification) or match pairs. A lesson never has match pairs twice, and the second activity uses new examples rather than repeating the first. Generated experiments are checked for unsafe materials (fire and heat, blades, strong chemicals, mains electricity; `src/lib/lesson/safety.ts`) and sent back for repair if they use any. Each stage is validated with Zod plus the lesson's cross-reference rules, and repaired at most once by feeding the problems back to the model. The model writes content only; ids, section types, origin labels and sources are added in code, so it can't invent citations. `server/` holds the server-only Claude client, configuration and rate limits; `sample.ts` is the no-AI mode.
- **`src/lib/generation/evidence.ts`** — evidence as numbered excerpts: pasted reference text is split into `ref-N` excerpts, and web research turns the search tool's citations into `web-N` excerpts. Explanation sections and quiz questions must cite excerpt ids, the schema only accepts ids that exist, and a lesson's sources are exactly the excerpts it cites, with text and URLs copied from the evidence.
- **`src/app/api/lessons/generate/route.ts`** — validates and rate-limits the request, then streams progress as newline-delimited JSON. **`/create`** shows only the stages the server reports and keeps the form filled in on failure.
- **`src/lib/storage/store.ts`** — one `LessonStore` interface with two implementations: IndexedDB for guests and the account API for signed-in users. `StoreProvider` picks one from the session; the editor, player and library don't know which.
- **`src/lib/server/`** — server-only code: Drizzle schema and connection (`db/`), Better Auth setup (`auth.ts`), per-user lesson storage (`lessons.ts`, every query filtered by owner) and request helpers (`http.ts`: session check, same-origin check for writes, body size limits). API routes live under `src/app/api/`.
- **`src/lib/server/generationLog.ts`, `src/app/admin/generations/`** — the generation log: one `generation_usage` row per request and one `generation_call` row per model call, written by the generate route. The pages are for operators only (`src/lib/server/admin.ts`). `src/lib/generation/server/cost.ts` holds the price table used for the estimates.
- **`src/lib/server/demo.ts`** — demo sign-in settings and access-code checks; the check itself runs as a Better Auth hook in `auth.ts`, which also moves a demo account's lessons when its owner signs in properly.
- **`src/lib/server/errors.ts`, `src/instrumentation.ts`** — error reporting: Next.js's `onRequestError` hook, Better Auth's `onAPIError` and the generation route all call `reportError`, which logs, saves to `app_error` (pruned after 30 days) and optionally sends a webhook alert. `/admin/errors` shows them.
- **`src/lib/server/email.ts`** — email transports: the local mailbox file for development and tests, and Resend for deployments.
- **`src/lib/server/billing/`** — Stripe client and configuration, webhook handling (each event applied once, late or out-of-order events ignored), entitlements and the atomic monthly quota. Deleting an account cancels its subscription first.
- **`src/lib/i18n/`** — interface languages. `dictionaries/en.ts` is the source of truth and its type (`Dictionary`) makes `bg.ts` complete; a missing or extra key fails the typecheck. Server code uses `getT()` (pages) or `localeFromRequest()` (API routes); client components use `useT()`. `LocaleScope` switches a subtree to the lesson's language. `detect.ts` picks a lesson's language from its topic.
- **`src/app/dev/mailbox/page.dev.tsx`** — the development mailbox. The `.dev.tsx` page extension is only registered outside production builds (`next.config.ts`), so the route does not exist in production.
- **`src/components/editor/`** — form-based review editor. Curated samples are read-only, so saving an edited sample creates a copy. A failed save lists each problem with a link to the field that needs fixing (`src/lib/lesson/issues.ts`).

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Motion and Zod.
