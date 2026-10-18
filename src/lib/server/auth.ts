import "server-only";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins/anonymous";
import { magicLink } from "better-auth/plugins/magic-link";
import { cancelSubscriptionForDeletedUser } from "./billing/account";
import { getStripe } from "./billing/stripe";
import { cookieLocale, getDictionary, resolveLocale } from "@/lib/i18n";
import { getDb, schema } from "./db";
import { DEMO_CODE_HEADER, DEMO_EMAIL_DOMAIN, demoSignInConfig, isDemoCodeValid } from "./demo";
import { isEmailSignInEnabled, sendEmail } from "./email";
import { reportError } from "./errors";
import { moveAccountData } from "./lessons";

const DEMO_SIGN_IN_PATH = "/sign-in/anonymous";
const MAGIC_LINK_PATH = "/sign-in/magic-link";

/**
 * Sign-in methods that can be switched off are refused on the server, whatever the form shows: email links
 * when `EMAIL_SIGN_IN=false`, and demo accounts unless demo sign-in is on, then only with a valid access code
 * if any are configured.
 */
const guardSignIn = createAuthMiddleware(async (ctx) => {
  if (ctx.path === MAGIC_LINK_PATH && !isEmailSignInEnabled()) {
    throw new APIError("NOT_FOUND", { message: "Email sign-in is off." });
  }
  if (ctx.path !== DEMO_SIGN_IN_PATH) return;
  const demo = demoSignInConfig();
  if (!demo.enabled) throw new APIError("NOT_FOUND", { message: "Demo sign-in is off." });
  if (demo.codes.length > 0 && !isDemoCodeValid(ctx.headers?.get(DEMO_CODE_HEADER), demo.codes)) {
    throw new APIError("FORBIDDEN", { message: "That access code isn't valid.", code: "INVALID_ACCESS_CODE" });
  }
});

function googleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { google: { clientId, clientSecret } } : undefined;
}

export function isGoogleSignInEnabled(): boolean {
  return googleProvider() !== undefined;
}

async function createAuth() {
  const db = await getDb();
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    socialProviders: googleProvider(),
    // Only the end-to-end test server turns this off: every test signs in from localhost.
    // Demo sign-in gets a tighter limit, so access codes can't be guessed by trying many quickly.
    rateLimit:
      process.env.DISABLE_AUTH_RATE_LIMIT === "true"
        ? { enabled: false }
        : { customRules: { [DEMO_SIGN_IN_PATH]: { window: 60, max: 5 } } },
    hooks: { before: guardSignIn },
    // Unexpected failures (a database or email provider error) go to the error log. Refusals such as a wrong
    // access code are 4xx responses, not errors.
    onAPIError: {
      onError: async (error) => {
        if (error instanceof APIError && error.statusCode < 500) return;
        await reportError({ source: "auth", error });
      },
    },
    user: {
      // Deleting the user cascades to their lessons, attempts and sessions (see the schema).
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await cancelSubscriptionForDeletedUser(db, user.id, (id) => getStripe().subscriptions.cancel(id));
        },
      },
    },
    plugins: [
      anonymous({
        emailDomainName: DEMO_EMAIL_DOMAIN,
        generateName: () => "Demo account",
        // Signing in with email or Google from a demo account keeps the lessons made in it.
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await moveAccountData(db, anonymousUser.user.id, newUser.user.id);
        },
      }),
      magicLink({
        expiresIn: 15 * 60,
        sendMagicLink: async ({ email, url }, ctx) => {
          // The email is written in the language the person is using the app in.
          const headers = ctx?.headers ?? ctx?.request?.headers;
          const t = getDictionary(
            resolveLocale(cookieLocale(headers?.get("cookie")), headers?.get("accept-language")),
          );
          await sendEmail({ to: email, subject: t.email.signInSubject, text: t.email.signInBody(url), url });
        },
      }),
    ],
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;

const globalForAuth = globalThis as unknown as { lessonBuilderAuth?: Promise<Auth> };

export function getAuth(): Promise<Auth> {
  globalForAuth.lessonBuilderAuth ??= createAuth().catch((error) => {
    globalForAuth.lessonBuilderAuth = undefined;
    throw error;
  });
  return globalForAuth.lessonBuilderAuth;
}

/** `isDemo` marks demo accounts, which have a placeholder email and can't subscribe or see operator pages. */
export type SessionUser = { id: string; email: string; name: string; isDemo: boolean };

/** The signed-in user for a request, or null for guests. */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const { id, email, name, isAnonymous } = session.user;
  return { id, email, name, isDemo: Boolean(isAnonymous) };
}
