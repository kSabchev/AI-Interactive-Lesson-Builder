import "server-only";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export type Email = { to: string; subject: string; text: string; url?: string };
export type SentEmail = Email & { sentAt: string };

function transport(): string | undefined {
  // `||`, not `??`: an empty `EMAIL_TRANSPORT=` (as copied from .env.example) means "not set".
  return process.env.EMAIL_TRANSPORT || (process.env.NODE_ENV === "production" ? undefined : "file");
}

function mailboxFile(): string {
  return process.env.MAILBOX_FILE || path.join(process.cwd(), ".data", "mailbox.jsonl");
}

/** Resend's API, which takes a JSON body and a bearer key. */
const RESEND_URL = "https://api.resend.com/emails";

async function sendWithResend(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("EMAIL_TRANSPORT=resend needs RESEND_API_KEY and EMAIL_FROM.");
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    // The body explains the problem (unverified domain, bad key); it never contains the key itself.
    throw new Error(`Resend refused the email (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
}

/**
 * Where emails go:
 * - `EMAIL_TRANSPORT=resend` sends through Resend (`RESEND_API_KEY`, and `EMAIL_FROM` on a verified domain,
 *   e.g. `Lesson Builder <sign-in@example.com>`).
 * - `EMAIL_TRANSPORT=file` (the default outside production) appends each email to a local mailbox file
 *   (`MAILBOX_FILE`, default `.data/mailbox.jsonl`) and prints it, so sign-in works in development and tests.
 * - In production with no transport configured, sending fails loudly rather than pretending to deliver.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (transport() === "resend") return sendWithResend(email);

  if (transport() === "file") {
    const file = mailboxFile();
    await mkdir(path.dirname(file), { recursive: true });
    const sent: SentEmail = { ...email, sentAt: new Date().toISOString() };
    await appendFile(file, `${JSON.stringify(sent)}\n`);
    console.info(`[email] to ${email.to}: ${email.subject}${email.url ? `\n        ${email.url}` : ""}`);
    return;
  }

  throw new Error("Email delivery isn't configured (set EMAIL_TRANSPORT).");
}

/**
 * Whether the development mailbox page may show emails. Never in production: it would hand anyone the
 * sign-in links of every account.
 */
export function isDevMailboxEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && transport() === "file";
}

/** The most recent emails written to the local mailbox, newest first. */
export async function readDevMailbox(limit = 20): Promise<SentEmail[]> {
  if (!isDevMailboxEnabled()) return [];
  const text = await readFile(mailboxFile(), "utf8").catch(() => "");
  return text
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as SentEmail];
      } catch {
        return [];
      }
    })
    .reverse()
    .slice(0, limit);
}
