import { readFile } from "node:fs/promises";
import { expect, type Page } from "@playwright/test";

/** The test server writes sign-in emails here instead of sending them (EMAIL_TRANSPORT=file). */
export const MAILBOX_FILE = ".data/e2e-mailbox.jsonl";

type Email = { to: string; subject: string; url?: string };

async function emailsTo(address: string): Promise<Email[]> {
  const text = await readFile(MAILBOX_FILE, "utf8").catch(() => "");
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Email)
    .filter((email) => email.to === address);
}

/** Waits for the next sign-in email to `address` after `previousCount` emails, and returns its link. */
export async function latestLink(address: string, previousCount = 0): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(async () => {
      const emails = await emailsTo(address);
      link = emails.length > previousCount ? emails.at(-1)?.url : undefined;
      return link;
    })
    .toBeTruthy();
  return link!;
}

export function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Signs in through the magic-link flow, exactly as a person would. */
export async function signIn(page: Page, email: string) {
  const before = (await emailsTo(email)).length;
  await page.goto("/sign-in");
  // By role: the server-streamed copy of the form can still sit hidden in the DOM while hydrating.
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.goto(await latestLink(email, before));
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Account" })).toBeVisible();
}
