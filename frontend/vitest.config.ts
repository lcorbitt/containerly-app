import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@shared": path.resolve(__dirname, "../supabase/functions/_wire"),
      "@services": path.resolve(__dirname, "../supabase/functions/_services"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000/",
      },
    },
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules", ".next", "**/*.test.{ts,tsx}", "vitest.setup.ts"],
    },
  },
});
