import { describe, expect, it } from "vitest";
import { isOperator } from "./admin";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("isOperator", () => {
  it("accepts only listed emails, ignoring case and spaces", () => {
    const list = env({ NODE_ENV: "production", ADMIN_EMAILS: " Ops@Example.com , boss@example.com" });
    expect(isOperator("ops@example.com", list)).toBe(true);
    expect(isOperator("someone@example.com", list)).toBe(false);
  });

  it("lets every signed-in user in while developing with no list, and nobody in production", () => {
    expect(isOperator("dev@example.com", env({ NODE_ENV: "development" }))).toBe(true);
    expect(isOperator("dev@example.com", env({ NODE_ENV: "production" }))).toBe(false);
  });
});
