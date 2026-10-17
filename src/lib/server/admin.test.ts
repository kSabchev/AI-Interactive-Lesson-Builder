import { describe, expect, it } from "vitest";
import { isOperator } from "./admin";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
const person = (email: string, isDemo = false) => ({ email, isDemo });

describe("isOperator", () => {
  it("accepts only listed emails, ignoring case and spaces", () => {
    const list = env({ NODE_ENV: "production", ADMIN_EMAILS: " Ops@Example.com , boss@example.com" });
    expect(isOperator(person("ops@example.com"), list)).toBe(true);
    expect(isOperator(person("someone@example.com"), list)).toBe(false);
  });

  it("lets every signed-in user in while developing with no list, and nobody in production", () => {
    expect(isOperator(person("dev@example.com"), env({ NODE_ENV: "development" }))).toBe(true);
    expect(isOperator(person("dev@example.com"), env({ NODE_ENV: "production" }))).toBe(false);
  });

  it("never counts a demo account, even with a matching email or while developing", () => {
    expect(isOperator(person("ops@example.com", true), env({ NODE_ENV: "production", ADMIN_EMAILS: "ops@example.com" }))).toBe(false);
    expect(isOperator(person("temp@demo.invalid", true), env({ NODE_ENV: "development" }))).toBe(false);
  });
});
