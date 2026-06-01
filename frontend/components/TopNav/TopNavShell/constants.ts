import type { TopNavVariant } from "./types";

/** Header bar — frosted glass. */
export const TOP_NAV_SHELL_SURFACE_CLASS: Record<TopNavVariant, string> = {
  marketing:
    "border-zinc-200 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:border-white/10 dark:bg-zinc-950/90 dark:supports-[backdrop-filter]:bg-zinc-950/80",
  app: "border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90",
};

/** Bookmark tab — opaque so the header border-b cannot bleed through during theme fades. */
export const TOP_NAV_SHELL_BOOKMARK_SURFACE_CLASS: Record<TopNavVariant, string> = {
  marketing: "border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950",
  app: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
};

const TOP_NAV_SHELL_BASE_CLASS = "shrink-0 overflow-visible color-fade border-b";

export const TOP_NAV_SHELL_CLASS: Record<TopNavVariant, string> = {
  marketing: `sticky top-0 z-50 ${TOP_NAV_SHELL_BASE_CLASS} ${TOP_NAV_SHELL_SURFACE_CLASS.marketing}`,
  app: `relative z-40 ${TOP_NAV_SHELL_BASE_CLASS} ${TOP_NAV_SHELL_SURFACE_CLASS.app}`,
};

export const TOP_NAV_SHELL_INNER_CLASS =
  "relative mx-auto flex h-14 w-full items-center px-4 md:h-20 md:px-12";

/** Overlaps header bottom edge to mask border-b under the tab (see BOOKMARK_SURFACE). */
export const TOP_NAV_THEME_TOGGLE_BOOKMARK_CLASS =
  "pointer-events-auto absolute top-full right-6 z-20 -mt-1 md:right-12";

const TOP_NAV_THEME_TOGGLE_BOOKMARK_BASE_CLASS =
  "flex h-8 w-9 cursor-pointer items-center justify-center rounded-b-lg border-x border-b border-t-0 text-zinc-500 hover:text-zinc-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:text-zinc-400 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-500/30";

export const TOP_NAV_THEME_TOGGLE_BOOKMARK_BUTTON_CLASS: Record<TopNavVariant, string> = {
  marketing: `${TOP_NAV_THEME_TOGGLE_BOOKMARK_BASE_CLASS} ${TOP_NAV_SHELL_BOOKMARK_SURFACE_CLASS.marketing}`,
  app: `${TOP_NAV_THEME_TOGGLE_BOOKMARK_BASE_CLASS} ${TOP_NAV_SHELL_BOOKMARK_SURFACE_CLASS.app}`,
};
