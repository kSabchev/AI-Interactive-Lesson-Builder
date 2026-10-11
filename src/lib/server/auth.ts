import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { getDb, schema } from "./db";
import { sendEmail } from "./email";

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
    rateLimit: process.env.DISABLE_AUTH_RATE_LIMIT === "true" ? { enabled: false } : undefined,
    user: {
      // Deleting the user cascades to their lessons, attempts and sessions (see the schema).
      deleteUser: { enabled: true },
    },
    plugins: [
      magicLink({
        expiresIn: 15 * 60,
        sendMagicLink: async ({ email, url }) => {
          await sendEmail({
            to: email,
            subject: "Your sign-in link for Lesson Builder",
            text: `Click to sign in to Lesson Builder:\n\n${url}\n\nThe link works once and expires in 15 minutes. If you didn't ask for it, you can ignore this email.`,
            url,
          });
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

export type SessionUser = { id: string; email: string; name: string };

/** The signed-in user for a request, or null for guests. */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}
