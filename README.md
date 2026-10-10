# AI Interactive Lesson Builder

A web app that turns a science topic into an interactive lesson and follow-up quiz for learners aged 8–12. An adult reviews the lesson, presents it on one shared screen with hands-on activities, and checks understanding with a quiz tied directly to what was taught.

## Status

| Milestone | State |
| --- | --- |
| 1. Lesson player | ✅ Full-screen player, progress, keyboard navigation, prediction / diagram labeling / sorting activities |
| 2. Quiz and results | ✅ Five locked-in questions, feedback, score, concepts to revisit, links back to lesson sections |
| 3. Creation and editing | ⏳ Configuration form, review editor, IndexedDB persistence |
| 4. AI generation | ⏳ Server pipeline, structured output, validation and retries |
| 5. Evidence support | ⏳ Pasted references, source display, optional web research |
| 6. Portfolio polish | 🟡 Three curated sample lessons done (water cycle, solar system, photosynthesis); accessibility pass and deployment to do |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm test` | Unit tests (Vitest): lesson schema, scoring, activity checking |
| `npm run e2e` | Playwright journey tests on desktop and tablet viewports (builds the app first) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## How it fits together

- **`src/lib/lesson/schema.ts`** — the lesson data model as Zod schemas. Sections are a discriminated union (`hook`, `explanation`, `prediction`, `diagram-labeling`, `sorting`, `recap`). Cross-reference checks make sure every quiz question points at a real objective, section and source, that each objective is covered by the quiz, and that diagrams and visuals come from the approved asset lists. The same schema will validate AI output.
- **`src/lib/assets/`** — approved diagrams (with labelled target positions) and illustrations. Lessons reference assets by id, so topics without a matching diagram fall back to prediction and sorting activities.
- **`src/content/samples/`** — curated lessons, validated when loaded.
- **`src/lib/quiz/scoring.ts`, `src/lib/activities/checking.ts`** — pure logic for scoring and activity feedback, unit tested.
- **`src/components/sections/`** — one renderer per section type; `SectionView` dispatches on `type`.
- **`src/components/player/LessonPlayer.tsx`** — presentation player (←/→ or PageUp/PageDown to navigate, `F` for full screen, facilitator notes toggle).
- **`src/components/quiz/`** — quiz runner and results.

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Motion and Zod.
