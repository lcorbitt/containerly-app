export const SIDEBAR_SETTINGS_HEADER_CLASS =
  "flex items-center justify-between gap-2";

export const SIDEBAR_SETTINGS_LABEL_CLASS =
  "text-xs font-semibold text-zinc-900 dark:text-zinc-100";

export const SIDEBAR_SETTINGS_COG_BTN_CLASS =
  "inline-flex shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 aria-expanded:bg-zinc-100 aria-expanded:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 dark:aria-expanded:bg-zinc-800 dark:aria-expanded:text-zinc-200";

export const SIDEBAR_SETTINGS_BODY_CLASS = "mt-2";

export const SIDEBAR_SETTINGS_EMPTY_CLASS =
  "text-sm text-zinc-500 dark:text-zinc-400";

export const SIDEBAR_SETTINGS_POPOVER_REVEAL_CLASS =
  "absolute inset-x-0 top-6 z-50";

export const SIDEBAR_SETTINGS_POPOVER_CLASS =
  "rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-950";

export const SIDEBAR_SETTINGS_POPOVER_HINT_CLASS =
  "text-xs leading-snug text-zinc-500 dark:text-zinc-400";

export const SIDEBAR_SETTINGS_POPOVER_SECTION_LABEL_CLASS =
  "mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500";

export const SIDEBAR_SETTINGS_SEARCH_INPUT_CLASS =
  "mt-2 w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500";

export const SIDEBAR_SETTINGS_USER_LIST_CLASS =
  "mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-700";

export const SIDEBAR_SETTINGS_USER_OPTION_CLASS = (selected: boolean) =>
  `flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm transition-colors ${
    selected
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900/80"
  }`;
