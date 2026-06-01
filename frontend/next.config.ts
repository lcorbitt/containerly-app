import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const sharedRoot = path.join(frontendRoot, "shared");

const nextConfig: NextConfig = {
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
