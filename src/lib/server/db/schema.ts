import { boolean, index, integer, jsonb, numeric, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { Lesson } from "@/lib/lesson/schema";
import type { QuizAnswers } from "@/lib/quiz/scoring";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

// --- Better Auth tables (field names must match its core schema) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** Set by Better Auth's anonymous plugin for demo accounts, which have a placeholder email. */
  isAnonymous: boolean("is_anonymous").default(false),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// --- App tables ---

/**
 * Saved lessons. The validated lesson is stored whole in `data`; the other columns are copies for listing
 * and sorting. Keyed by (user, lesson id) so ids only need to be unique per user, and every query is scoped
 * to its owner by construction.
 */
export const lesson = pgTable(
  "lesson",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    ageGroup: text("age_group").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    contentOrigin: text("content_origin").notNull(),
    data: jsonb("data").$type<Lesson>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("lesson_user_updated_idx").on(t.userId, t.updatedAt)],
);

/** The latest quiz attempt per user and lesson. `lessonId` may be a curated sample, so it has no foreign key. */
export const quizAttempt = pgTable(
  "quiz_attempt",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    answers: jsonb("answers").$type<QuizAnswers>().notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

/**
 * One row per generation request; the basis for plan quotas and cost reporting. Token totals are the sum of
 * the request's model calls (`generation_call`). `inputTokens` excludes cached input, which is counted apart.
 */
export const generationUsage = pgTable(
  "generation_usage",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    mode: text("mode").notNull(),
    model: text("model"),
    status: text("status").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    webSearches: integer("web_searches").notNull().default(0),
    estimatedUsd: numeric("estimated_usd", { precision: 10, scale: 4 }).notNull().default("0"),
    /** The lesson this request produced (or would have produced), and what was asked for. */
    lessonId: text("lesson_id"),
    lessonTitle: text("lesson_title"),
    topic: text("topic"),
    ageGroup: text("age_group"),
    language: text("language"),
    quality: text("quality"),
    /** "none", "reference" or "web". */
    evidence: text("evidence"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("generation_usage_user_created_idx").on(t.userId, t.createdAt),
    index("generation_usage_created_idx").on(t.createdAt),
  ],
);

/** One row per model call within a generation request, in call order: the per-stage cost breakdown. */
export const generationCall = pgTable(
  "generation_call",
  {
    id: serial("id").primaryKey(),
    usageId: integer("usage_id")
      .notNull()
      .references(() => generationUsage.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    /** research, outline, content or quiz. */
    stage: text("stage").notNull(),
    /** 1 for the first try, 2 for a repair; for research, the continuation turn. */
    attempt: integer("attempt").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cacheReadTokens: integer("cache_read_tokens").notNull(),
    cacheWriteTokens: integer("cache_write_tokens").notNull(),
    webSearches: integer("web_searches").notNull(),
    estimatedUsd: numeric("estimated_usd", { precision: 10, scale: 4 }).notNull(),
    durationMs: integer("duration_ms").notNull(),
  },
  (t) => [index("generation_call_usage_idx").on(t.usageId, t.seq)],
);

// --- Billing ---

/**
 * A user's Stripe customer and current subscription, kept in sync by webhooks. `plan` is what the user is
 * entitled to right now; `stripeEventAt` is the creation time of the last applied event, so older events
 * arriving late can't overwrite newer state.
 */
export const billingAccount = pgTable("billing_account", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  subscriptionId: text("subscription_id"),
  plan: text("plan").notNull().default("free"),
  status: text("status"),
  priceId: text("price_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  stripeEventAt: timestamp("stripe_event_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Stripe event ids already handled, so redelivered webhooks are ignored. */
export const stripeEvent = pgTable("stripe_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Generations used per user per month. Incremented atomically against the plan limit. */
export const generationQuota = pgTable(
  "generation_quota",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    used: integer("used").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.period] })],
);

// --- Operations ---

/** Server errors, for the operator error log. Kept for 30 days; see `src/lib/server/errors.ts`. */
export const appError = pgTable(
  "app_error",
  {
    id: serial("id").primaryKey(),
    /** Where it was caught: "request" (Next.js), "auth" (Better Auth) or "generation". */
    source: text("source").notNull(),
    message: text("message").notNull(),
    stack: text("stack"),
    /** The request path and method, and Next.js's digest for errors thrown while rendering. */
    path: text("path"),
    method: text("method"),
    digest: text("digest"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("app_error_created_idx").on(t.createdAt)],
);
