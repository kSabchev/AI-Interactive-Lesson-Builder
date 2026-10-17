import { describe, expect, it } from "vitest";
import { demoSignInConfig, isDemoCodeValid } from "./demo";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("demo sign-in settings", () => {
  it("is off unless DEMO_SIGN_IN is exactly true, and reads a comma-separated list of codes", () => {
    expect(demoSignInConfig(env({}))).toEqual({ enabled: false, codes: [] });
    expect(demoSignInConfig(env({ DEMO_SIGN_IN: "yes" })).enabled).toBe(false);
    expect(demoSignInConfig(env({ DEMO_SIGN_IN: "true", DEMO_ACCESS_CODES: " spring-class , , ana-2026 " }))).toEqual({
      enabled: true,
      codes: ["spring-class", "ana-2026"],
    });
  });
});

describe("isDemoCodeValid", () => {
  const codes = ["spring-class", "Ana-2026"];

  it("accepts any listed code, ignoring case and surrounding spaces", () => {
    expect(isDemoCodeValid("spring-class", codes)).toBe(true);
    expect(isDemoCodeValid("  ANA-2026 ", codes)).toBe(true);
  });

  it("rejects other, empty and missing codes, and everything when no codes are set", () => {
    expect(isDemoCodeValid("spring", codes)).toBe(false);
    expect(isDemoCodeValid("spring-class-x", codes)).toBe(false);
    expect(isDemoCodeValid("", codes)).toBe(false);
    expect(isDemoCodeValid(null, codes)).toBe(false);
    expect(isDemoCodeValid("anything", [])).toBe(false);
  });
});
