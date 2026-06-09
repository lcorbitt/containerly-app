export const CONTAINERS_OVERVIEW_PANEL_CLASS =
  "overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

export const CONTAINERS_OVERVIEW_ROW_CLASS =
  "block border-b border-zinc-100 px-5 py-4 transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60";

export const CONTAINERS_SCOPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "participating", label: "Collaborating" },
  { id: "unassigned", label: "Unassigned" },
] as const;

export const CONTAINERS_FILTER_ACTIVE_CLASS =
  "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50";

export const CONTAINERS_FILTER_INACTIVE_CLASS =
  "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100";

export const CONTAINERS_GROWTH_CALLOUT_CLASS =
  "rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100";
