import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type Email = { to: string; subject: string; text: string; url?: string };

/**
 * Where emails go. A real provider arrives with launch readiness; until then:
 * - `EMAIL_TRANSPORT=file` (the default outside production) appends each email to a local mailbox file
 *   (`MAILBOX_FILE`, default `.data/mailbox.jsonl`) and prints it, so sign-in works in development and tests.
 * - In production with no transport configured, sending fails loudly rather than pretending to deliver.
 */
export async function sendEmail(email: Email): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? (process.env.NODE_ENV === "production" ? undefined : "file");

  if (transport === "file") {
    const file = process.env.MAILBOX_FILE || path.join(process.cwd(), ".data", "mailbox.jsonl");
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify({ ...email, sentAt: new Date().toISOString() })}\n`);
    console.info(`[email] to ${email.to}: ${email.subject}${email.url ? `\n        ${email.url}` : ""}`);
    return;
  }

  throw new Error("Email delivery isn't configured (set EMAIL_TRANSPORT).");
}
