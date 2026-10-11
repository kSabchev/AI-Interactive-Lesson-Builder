import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // Tests use a throwaway in-memory database and never send real email.
    env: { PGLITE_DIR: "memory://", EMAIL_TRANSPORT: "file", MAILBOX_FILE: ".data/test-mailbox.jsonl" },
  },
});
