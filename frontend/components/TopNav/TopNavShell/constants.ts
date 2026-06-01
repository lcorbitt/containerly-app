import type { TopNavVariant } from "./types";

export const TOP_NAV_SHELL_CLASS: Record<TopNavVariant, string> = {
  marketing:
    "relative z-50 shrink-0 border-b border-zinc-200 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:border-white/10 dark:bg-zinc-950/90 dark:supports-[backdrop-filter]:bg-zinc-950/80",
  app: "z-40 shrink-0 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90",
};
