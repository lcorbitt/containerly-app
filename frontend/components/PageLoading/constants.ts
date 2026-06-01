/** Main pane height below authenticated TopNav (h-14 / md:h-20). */
export const PAGE_LOADING_MIN_HEIGHT_CLASS =
  "min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-5rem)]";

export const PAGE_LOADING_SHELL_CLASS = `flex w-full min-w-0 items-center justify-center px-4 ${PAGE_LOADING_MIN_HEIGHT_CLASS}`;

export const PAGE_LOADING_CONTENT_CLASS =
  "flex flex-col items-center justify-center gap-3";

/** Centered indicator for navigation overlays (no full-pane min-height). */
export const PAGE_LOADING_OVERLAY_SHELL_CLASS =
  "flex w-full max-w-sm items-center justify-center rounded-xl bg-white/90 px-6 py-5 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-950/90 dark:ring-zinc-800";
