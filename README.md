# AI Interactive Lesson Builder

A web app that turns a science topic into an interactive lesson and follow-up quiz for learners aged 8–12. An adult reviews the lesson, presents it on one shared screen with hands-on activities, and checks understanding with a quiz tied directly to what was taught.

## Status

The product is becoming a subscription SaaS for parents and teachers. The milestone plan, decisions and draft tiers are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

| Milestone | State |
| --- | --- |
| 1–3. Player, quiz and results, review editor with local persistence | ✅ |
| 4. AI generation | 🟡 Built and tested in sample mode; the live check with a real API key is still to do |
| 5–9. Accounts, billing, evidence support, classroom tier, launch readiness | ⏳ |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

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
- **`src/app/api/lessons/generate/route.ts`** — validates and rate-limits the request, then streams progress as newline-delimited JSON. **`/create`** shows only the stages the server reports and keeps the form filled in on failure.
- **`src/components/editor/`** — form-based review editor. Curated samples are read-only, so saving an edited sample creates a copy. A failed save lists each problem with a link to the field that needs fixing (`src/lib/lesson/issues.ts`).

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Motion and Zod.
