import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(frontendRoot, "..");
/** Cross-runtime wire types + notifications (under `supabase/functions/_wire` for Edge bundling). */
const sharedRoot = path.join(repoRoot, "supabase", "functions", "_wire");

const nextConfig: NextConfig = {
  /** Allow `@shared` imports from `supabase/functions/_wire` (outside `frontend/`). */
  experimental: {
    externalDir: true,
  },
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
    root: repoRoot,
    resolveAlias: {
      "@shared": sharedRoot,
      "@supabase-shared": path.join(repoRoot, "supabase", "functions", "_lib"),
      "@": frontendRoot,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@shared": sharedRoot,
      "@supabase-shared": path.join(repoRoot, "supabase", "functions", "_lib"),
    };
    return config;
  },
};

export default nextConfig;
