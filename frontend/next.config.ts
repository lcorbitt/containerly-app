import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const sharedRoot = path.join(frontendRoot, "shared");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/containerly-logo-nav.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: frontendRoot,
    resolveAlias: {
      "@shared": sharedRoot,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@shared": sharedRoot,
    };
    return config;
  },
};

export default nextConfig;
