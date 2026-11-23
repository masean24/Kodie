import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build mandiri (.next/standalone) untuk image Docker di Coolify. Lihat Dockerfile dan DEPLOY-COOLIFY.md.
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.110.34", "192.168.*.*", "10.*.*.*"],
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
