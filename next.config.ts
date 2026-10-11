import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
