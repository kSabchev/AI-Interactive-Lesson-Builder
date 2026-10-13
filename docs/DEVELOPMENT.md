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

Margin check: 30 Sonnet lessons at ~$0.15 cost ~$4.50, which fits $9 after payment fees. 30 Opus lessons at ~$0.40 would not, hence the Opus weighting.

## Milestones

| # | Milestone | State |
| --- | --- | --- |
| 1 | Lesson player | ✅ |
| 2 | Quiz and results | ✅ |
| 3 | Review editor and local persistence | ✅ |
| 4 | AI generation | 🟡 steps 1–9 done; step 10 (live check) needs an API key |
| 5 | Accounts and cloud data | ✅ (email delivery provider pending, see milestone 9) |
| 6 | Subscriptions and billing | ✅ Free and Pro; Classroom waits for milestone 8 |
| 7 | Evidence support | ✅ reference excerpts and web research cited per section and question |
| 8 | Classroom tier | ⏳ (build when there is demand) |
| 9 | Launch readiness | 🚧 CI done |

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

### 8. Classroom tier

Schools as organizations with seats, invitations and owner/teacher roles; shared lesson library; pooled usage; seat-based billing.

### 9. Launch readiness

1. Legal: terms of service, privacy policy, cookie notice if analytics are added, statement that no learner data is collected.
2. Data protection: export and deletion; EU hosting option for EU schools.
3. Transactional email (Resend or Postmark): sign-in, receipts, quota warnings.
4. Operations: error tracking, AI spend dashboard with alerts and a Console spend limit, simple admin view.
5. Security: rate limits on sign-in and generation in shared storage, CSRF protection, security headers, security review.
6. Delivery: accessibility checks (`@axe-core/playwright`), keyboard and screen-reader pass, responsive check, CI (lint, typecheck, unit, end-to-end in sample mode), preview and production environments, migrations in CI.
7. Marketing: landing page, pricing, FAQ; samples stay available without sign-up.
