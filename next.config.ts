import type { NextConfig } from "next";

/**
 * `*.dev.tsx` routes (the development mailbox) only exist outside production builds, so production returns a
 * plain 404 for them without rendering anything.
 */
const pageExtensions =
  process.env.NODE_ENV === "production" ? ["tsx", "ts", "jsx", "js"] : ["dev.tsx", "tsx", "ts", "jsx", "js"];

const nextConfig: NextConfig = {
  pageExtensions,
  // The end-to-end tests build into their own folder (NEXT_DIST_DIR=.next-e2e), so a test run never
  // overwrites the files a running `npm run dev` is using.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  // Database drivers load native/WASM files at runtime, so they run from node_modules instead of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
