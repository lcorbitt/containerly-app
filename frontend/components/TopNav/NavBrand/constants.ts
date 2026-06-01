import type { TopNavVariant } from "../TopNavShell/types";

export const NAV_BRAND_CLASS: Record<TopNavVariant, string> = {
  marketing:
    "text-lg font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-700 md:text-xl dark:text-white dark:hover:text-zinc-100",
  app: "text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl",
};

export const NAV_BRAND_TEXT_CLASS: Record<TopNavVariant, string> = {
  marketing: "text-2xl font-bold",
  app: "text-2xl font-bold",
};
