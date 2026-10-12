import { rm } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDevMailboxEnabled, readDevMailbox, sendEmail } from "./email";

const FILE = ".data/email-test-mailbox.jsonl";
const email = { to: "parent@example.com", subject: "Your sign-in link", text: "Link", url: "http://localhost/x" };

beforeEach(async () => {
  vi.stubEnv("MAILBOX_FILE", FILE);
  vi.spyOn(console, "info").mockImplementation(() => {});
  await rm(FILE, { force: true });
});

afterEach(() => vi.unstubAllEnvs());

describe("sendEmail", () => {
  it("treats an empty EMAIL_TRANSPORT as unset and writes to the local mailbox outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_TRANSPORT", "");
    await sendEmail(email);
    expect((await readDevMailbox()).map((e) => e.to)).toEqual(["parent@example.com"]);
  });

  it("refuses to pretend to send in production without a provider", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_TRANSPORT", "");
    await expect(sendEmail(email)).rejects.toThrow("Email delivery isn't configured");
  });
});

describe("development mailbox", () => {
  it("lists the newest emails first", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await sendEmail({ ...email, subject: "first" });
    await sendEmail({ ...email, subject: "second" });
    expect((await readDevMailbox()).map((e) => e.subject)).toEqual(["second", "first"]);
  });

  it("is never available in production, even with the file transport", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_TRANSPORT", "file");
    await sendEmail(email);
    expect(isDevMailboxEnabled()).toBe(false);
    expect(await readDevMailbox()).toEqual([]);
  });
});
