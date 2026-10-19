# Development plan

The product is moving from a portfolio demo to a subscription SaaS for parents and teachers. This plan supersedes the milestone table in the original specification from milestone 4 onwards.

## Decisions

| Decision | Choice | Notes |
| --- | --- | --- |
| Launch or demo | Build launch-ready; payments stay in test mode until going live is a deliberate choice | Same code either way; legal, tax and support work can wait |
| Who has accounts | Adults only (parents and teachers) | Learners use the shared screen without logging in, so no children's data is collected (COPPA / GDPR-K) |
| Stack | Postgres (Neon or Supabase in production, embedded PGlite locally), Drizzle ORM, Better Auth | Chosen at milestone 5 |
| Payments | Stripe Billing (Checkout + Customer Portal + webhooks) | Chosen at milestone 6. Tax is our responsibility; `STRIPE_AUTOMATIC_TAX=true` turns on Stripe Tax once it's set up |
| Usage unit | Monthly lesson generations, enforced on the server | AI cost is the main variable cost |

## Tiers (draft — validate against measured cost per lesson)

| | Free | Pro | Classroom |
| --- | --- | --- | --- |
| Price | $0 | ~$9/month or $90/year | ~$6 per teacher per month, minimum 3 |
| AI lessons per month | 3 | 30 | 50 per teacher |
| Model | Sonnet 5.5 | Sonnet 5.5; Opus 5.5 optional, counted as 2 generations | Opus 5.5 |
| Saved lessons | 10 | Unlimited | Unlimited + shared school library |
| Reference-based and web-researched lessons | — | ✓ | ✓ |
| Samples, editor, player, quiz | ✓ | ✓ | ✓ |

Margin check: measured in October 2026, a standard (Sonnet 5.5) lesson costs about $0.05–0.07 and takes 35–50 seconds (7 live lessons, no repairs), so 30 lessons cost about $2, well within $9 after payment fees. Opus lessons cost roughly twice as much per token, hence counting them as two. Web research adds about $0.01 per search.

## Milestones

| # | Milestone | State |
| --- | --- | --- |
| 1 | Lesson player | ✅ |
| 2 | Quiz and results | ✅ |
| 3 | Review editor and local persistence | ✅ |
| 4 | AI generation | ✅ live lessons checked on the demo in October 2026; templates to improve in milestone 10 |
| 5 | Accounts and cloud data | ✅ (email delivery provider pending, see milestone 9) |
| 6 | Subscriptions and billing | ✅ Free and Pro; Classroom waits for milestone 8 |
| 7 | Evidence support | ✅ reference excerpts and web research cited per section and question |
| 7b | English and Bulgarian | ✅ interface toggle; lessons in the topic's language (Bulgarian text needs a native-speaker review) |
| 8 | Classroom tier | ⏳ (build when there is demand) |
| 9 | Launch readiness | 🚧 CI, generation log, error log, privacy notice, Resend sign-in email and a Render demo done |
| 10 | Richer lessons | ⏳ new activity types, lengths that differ in shape, a 12–14 age group, a diagram and picture library |

## Next steps (October 2026)

Order agreed after reviewing the project: prove the core before adding more around it.

1. ✅ **Prove generation on real topics.** Lessons generated on the demo look good; the templates can be improved later (milestone 10). Before merging pipeline changes, run a small manual live check (never in CI).
2. ✅ **Demo deployment.** Render, Resend, Google sign-in, a demo-only Claude key with a Console spend limit, a low daily cap, demo sign-in with access codes.
3. ✅ **Hygiene before inviting anyone.** Privacy notice, `EMAIL_SIGN_IN=false` until a domain is verified, the test build in its own folder, the error log. **Open:** the free Render database expires about 30 days after it was created (around mid-November 2026, check Render); upgrade or move it before then (README, "The database on Render").
4. **Real users.** 3–5 parents or teachers with their own access codes, and a native speaker for the Bulgarian text. Runs alongside step 5; what they say can reorder it.
5. **Richer lessons (milestone 10).** In this order:
   1. ✅ "Put in order", "Match pairs" and "Try it yourself" (experiment, opt-in), with each lesson's two activities chosen by the shape of the topic (see section 10). Checked live on 7 topics.
   2. A first batch of diagrams for the most requested topics (generation log), then more pictures.
   3. Lengths that differ in shape: 10 / 15 / 25 minutes.
   4. The 12–14 age group, with school grades shown next to ages.
   5. "Talk about it" (discussion) sections.
6. **Tune with data.** Per-stage model and effort (e.g. Haiku 5.5 for outline and quiz), regenerating a single section, prompt caching only if the log shows frequent repairs.
7. **Launch readiness (milestone 9).** Rate limits in shared storage, security headers, `@axe-core/playwright` checks, a verified Stripe test checkout, legal pages.
8. **Later, if there is demand.** Share links with "save a copy", AI-drawn pictures for topics the library doesn't cover, a full-period (40–45 minute) length, then the Classroom tier and a moderated shared library.

### 4. AI generation

1. Install `@anthropic-ai/sdk`; add `.env.example` (`ANTHROPIC_API_KEY`, `GENERATION_MODE=sample|live`, `GENERATION_MODEL`); keep `.env*` ignored.
2. Generation input schema shared by the form and the server: topic 3–120 characters, age group, duration, optional reference text (≤ 20,000 characters).
3. `LessonGenerator` interface with a deterministic **sample provider** (no API call, clearly labelled) and a server-only **Claude provider**.
4. Staged pipeline: validate input → outline (3 objectives, section plan, approved diagram or none) → section content → quiz → schema check with at most 2 repair retries that feed readable errors back to the model.
5. `POST /api/lessons/generate` streaming one event per stage the backend actually reaches, then the draft or a classified error.
6. Limits: input size, per-visitor rate limit, daily cap, `max_tokens`, timeout; log token usage per call.
7. Entitlement hook: the route asks whether the caller may generate and records usage afterwards. Until accounts exist, everyone gets the configured mode.
8. `/create` page: form, "Load example", stage progress, errors that keep inputs with Retry and a path to samples; success saves the draft and opens the editor.
9. Tests: input schema, pipeline with a fake provider (repair and give-up paths), route errors, end-to-end create → edit → present in sample mode.
10. Live check with a real key: 3–5 topics including one without a diagram; compare Opus 5.5 and Sonnet 5.5 quality and cost; set the default model and confirm tier prices.

### 5. Accounts and cloud data

1. Database tables: users, sessions, lessons (validated JSON plus indexed columns), quiz attempts, generation usage.
2. Sign-in with email magic link and Google; profile page; account deletion.
3. One storage interface with a browser implementation (guests) and a server implementation (signed-in users); editor and player unchanged.
4. Offer to import a guest's browser lessons on first sign-in.
5. Server routes check ownership on every read and write, and validate with `lessonSchema`.
6. Tests: cross-user access is denied; guest import works.

### 6. Subscriptions and billing

1. Plans defined in one config file (limits, features, prices) that the code checks.
2. Pricing page, checkout, self-service billing portal.
3. Webhook handler that verifies signatures, tolerates duplicate events, and handles renewals, cancellations, failed payments and grace periods.
4. Server-side entitlements: generation quota with atomic increments, saved-lesson cap, feature flags, model choice.
5. Interface: remaining quota, upgrade prompts at limits, downgrade rules. *As built:* at the saved-lesson cap an account can't add new lessons, but every existing lesson stays fully editable and nothing is deleted (simpler and friendlier than read-only lessons).
6. Tests: webhook replay, quota race conditions, expired and cancelled subscriptions.

### 7. Evidence support (paid feature)

1. Pasted reference text split into numbered excerpts; the model cites excerpt ids, never free text; `contentOrigin: "reference"`.
2. Content-origin labels in the player, editor and results; "check the facts" banner on AI drafts; sources shown at the end of the lesson and beside quiz explanations.
3. Optional web research via Claude's web search tool; source URLs come only from search results; `contentOrigin: "web-research"`.
4. Tests: every source id resolves; every URL exists in the stored search results.

### 7b. English and Bulgarian

1. Typed dictionaries (`src/lib/i18n/`), English as the source of truth; locale from a `locale` cookie, falling back to `Accept-Language`; EN / БГ toggle in every header.
2. Everything localized: pages and metadata, API and quota messages, sign-in emails, Stripe Checkout and Customer Portal, diagram labels and image descriptions, the Cyrillic subset of the Nunito font.
3. Lesson language detected from the topic's script (`lesson.language`, default `en`); the prompts ask for all learner-facing text in that language; repair feedback to the model stays in English.
4. Learner-facing parts follow the lesson's language (`LocaleScope`), adult-facing parts follow the interface.
5. Still to do: a native-speaker review of `bg.ts`; Bulgarian sample lessons, if sample mode should match Bulgarian topics with Bulgarian content; a live check of a Bulgarian topic with web research.

### 8. Classroom tier

Schools as organizations with seats, invitations and owner/teacher roles; shared lesson library; pooled usage; seat-based billing.

### 9. Launch readiness

1. Legal: terms of service, privacy policy, cookie notice if analytics are added, statement that no learner data is collected.
2. Data protection: export and deletion; EU hosting option for EU schools.
3. Transactional email: sign-in through Resend done (`EMAIL_TRANSPORT=resend`); receipts come from Stripe; quota warnings still to do.
4. Operations: error tracking, AI spend dashboard with alerts and a Console spend limit, simple admin view.
5. Security: rate limits on sign-in and generation in shared storage, CSRF protection, security headers, security review.
6. Delivery: accessibility checks (`@axe-core/playwright`), keyboard and screen-reader pass, responsive check, CI (lint, typecheck, unit, end-to-end in sample mode), preview and production environments, migrations in CI.
7. Marketing: landing page, pricing, FAQ; samples stay available without sign-up.

### 10. Richer lessons

**Where the template stands (October 2026).** Every generated lesson has the same seven sections — hook, predict, explain, activity (diagram labelling, or a second prediction), explain, sort, recap — with three objectives and a five-question quiz. The arc is sound (engage, guess, learn, do, apply, summarise, check) and the strict schema keeps lessons renderable and editable. Three weaknesses:

- **Length barely changes the lesson.** 10 and 15 minutes produce the same seven sections and five questions; only the paragraph guidance differs.
- **Age only changes vocabulary.** 8–10 and 11–12 differ by one prompt line.
- **Few activity types, few visuals.** Predict and sort in every lesson; diagram labelling only for the three topics with a diagram (water cycle, solar system, photosynthesis). The eight illustrations were drawn for the same three topics, so most generated lessons have no pictures at all. Lessons feel repetitive to someone using the app weekly.

**How a lesson's activities are chosen (done).** Each activity checks a different shape of knowledge: **put in order** a process (a chain of steps), **sort into groups** a classification (many examples, few groups), **match pairs** one-to-one facts (a part and its job, a term and its meaning). Every lesson has two activity slots:

| Slot | Choice, first that fits |
| --- | --- |
| **Do it** (section 4, after the first explanation) | label a diagram → put in order → match pairs → prediction |
| **Apply it** (section 6, after the second) | sort into groups → match pairs |

A lesson never has match pairs twice: if both slots ask for it, "apply it" sorts instead (decided in code, `chosenPlan`). "Apply it" must use new examples, not repeat "do it". **Try it yourself** is opt-in (a checkbox on the create form, since it needs materials prepared): it takes the "do it" slot, and a code check sends back experiments that mention fire or heat, blades, strong chemicals or mains electricity.

**Live check (October 2026, Sonnet 5.5, 7 lessons).** Butterfly life cycle: put in order + sort by stage. Parts of a plant: match pairs + sorting. Magnets: prediction + sorting. Float or sink (experiment): a clay-boat experiment + sorting new objects. How plants drink (experiment): celery in coloured water + sorting. Frog life cycle (Bulgarian): put in order + sorting. No repairs; $0.05–0.07 and 35–50 s per lesson. The first experiment run repeated the float/sink task in "apply it", which the new-examples rule fixed. The model rarely picks match pairs for "apply it", preferring sorting when groups exist, as the rule intends. Examples: the water cycle gets the diagram and sorting; the butterfly life cycle gets put in order and match pairs; parts of a plant gets match pairs and sorting.

**1. New activity types.** Each needs a schema, a player renderer, an editor, a checker, prompt guidance, English and Bulgarian text and tests: about half a day to a day each.

| Activity | What learners do | Why |
| --- | --- | --- |
| Put in order | Arrange the steps of a process | Interactive, fits most science topics (life cycles, digestion, eruptions), needs no art |
| Match pairs | Connect terms to meanings, or causes to effects | Interactive, quick to answer on a shared screen |
| Try it yourself | Adult-led experiment: materials, steps, what to notice, safety note | Valued by teachers; the prompt needs firm safety rules (household materials, adult supervision) |
| Talk about it | A class discussion question with prompts for the adult | Cheap; good for 11–12 and longer lessons |

**2. Lengths that differ in shape.** The schema's exact counts become ranges, so every saved lesson stays valid.

| Length | Sections | Quiz questions | Shape |
| --- | --- | --- | --- |
| 10 min | 5 | 3 | hook, predict, explain, one activity, recap |
| 15 min | 7 | 5 | today's structure |
| 25 min (new) | 9 | 6–7 | adds a second activity and an experiment or discussion section |

A 25-minute lesson produces about 40–60% more output, so it costs more and takes longer; measure with the generation log and decide whether it counts as two generations. A full school period (40–45 minutes) can come later.

**3. Age groups.** Add **12–14** (Bulgarian grades 5–7): same sections, with more precise terms, deeper "why" explanations, harder distractors and one or two more questions; new example topics; the site's "ages 8–12" wording updated. Show school grades next to ages, because teachers think in grades. **Not 5–7 yet:** early readers need read-aloud, picture-based activities and very little text, which is a different product.

**4. Diagrams and pictures.**

| Option | Cost per lesson | One-off cost | Accuracy | Notes |
| --- | --- | --- | --- | --- |
| **A. A larger hand-checked library** (chosen) | $0 | About 1–2 h per diagram, 15–30 min per picture | High: checked once | Consistent style, nothing new for the privacy notice; each diagram unlocks labelling for its topics |
| B. Claude draws a simple SVG per lesson | About $0.03–0.06 per picture | 1–2 days | Medium: the adult reviews it in the editor | No new vendor; SVG must be strictly sanitised |
| C. A separate image-generation service | Roughly $0.02–0.20 per image (check current prices) | 2–3 days, plus an account and image storage | Low for science: garbled labels, wrong details | Needs moderation and a privacy-notice update |
| D. Public-domain photos (NASA, Wikimedia Commons) | Free | 1–2 days | Real photos | Attribution and licences vary; quality uneven |

Plan: build library A first, about 20 diagrams and 30 pictures (roughly 4–6 days), in the order of the topics people request most (the generation log stores every topic). Candidates: parts of a plant, life cycles (butterfly, frog), states of matter, food chain, skeleton, heart, digestion, moon phases, layers of the Earth, volcano, simple circuit, magnets, light and shadow, how sound travels, weather. Add option B later only if many lessons still have no visual; skip C for now.
