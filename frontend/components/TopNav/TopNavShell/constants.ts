import type { TopNavVariant } from "./types";

/** Header bar — frosted glass. */
export const TOP_NAV_SHELL_SURFACE_CLASS: Record<TopNavVariant, string> = {
  marketing:
    "border-zinc-200 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:border-white/10 dark:bg-zinc-950/90 dark:supports-[backdrop-filter]:bg-zinc-950/80",
  app: "border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90",
};

const TOP_NAV_SHELL_BASE_CLASS = "shrink-0 overflow-visible color-fade border-b";

export const TOP_NAV_SHELL_CLASS: Record<TopNavVariant, string> = {
  marketing: `sticky top-0 z-50 ${TOP_NAV_SHELL_BASE_CLASS} ${TOP_NAV_SHELL_SURFACE_CLASS.marketing}`,
  app: `relative z-40 ${TOP_NAV_SHELL_BASE_CLASS} ${TOP_NAV_SHELL_SURFACE_CLASS.app}`,
};

export const TOP_NAV_SHELL_INNER_CLASS =
  "relative mx-auto flex h-14 w-full items-center px-4 md:h-20 md:px-12";
