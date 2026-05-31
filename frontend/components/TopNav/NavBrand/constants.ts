import type { TopNavVariant } from "../TopNavShell/types";

export const NAV_BRAND_CLASS: Record<TopNavVariant, string> = {
  marketing:
    "text-lg font-semibold tracking-tight text-white transition-[text-shadow] duration-300 hover:text-white [text-shadow:0_0_24px_var(--color-primary-orange)] md:text-xl",
  app: "text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl",
};
