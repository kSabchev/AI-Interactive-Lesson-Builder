import { rm } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDevMailboxEnabled, isEmailSignInEnabled, readDevMailbox, sendEmail } from "./email";

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

describe("Resend transport", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_TRANSPORT", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "Lesson Builder <sign-in@example.com>");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("posts the email to Resend with the API key", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "email-1" }));
    vi.stubGlobal("fetch", fetchMock);
    await sendEmail(email);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "Lesson Builder <sign-in@example.com>",
      to: "parent@example.com",
      subject: "Your sign-in link",
      text: "Link",
    });
  });

  it("fails loudly when Resend refuses, or when it isn't configured", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("domain is not verified", { status: 403 })));
    await expect(sendEmail(email)).rejects.toThrow("Resend refused the email (403): domain is not verified");

    vi.stubEnv("EMAIL_FROM", "");
    await expect(sendEmail(email)).rejects.toThrow("needs RESEND_API_KEY and EMAIL_FROM");
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

describe("isEmailSignInEnabled", () => {
  it("is on unless EMAIL_SIGN_IN is false", () => {
    expect(isEmailSignInEnabled({} as NodeJS.ProcessEnv)).toBe(true);
    expect(isEmailSignInEnabled({ EMAIL_SIGN_IN: "false" } as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});
