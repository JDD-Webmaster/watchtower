import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output — the production Dockerfile copies only
  // .next/standalone + .next/static + public/, not node_modules.
  output: "standalone",
  cacheComponents: true,
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
