export const DASHBOARD_SYNC_HEALTH_PANEL_CLASS =
  "flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

export const DASHBOARD_SYNC_HEALTH_TITLE_CLASS = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";

export const DASHBOARD_SYNC_HEALTH_SUBTITLE_CLASS = "mt-0.5 text-xs text-zinc-500 dark:text-zinc-400";

export const SYNC_STATUS_BAR_CLASS: Record<string, string> = {
  failed: "bg-red-500 dark:bg-red-600",
  active: "bg-emerald-500 dark:bg-emerald-600",
  syncing: "bg-sky-500 dark:bg-sky-600",
  pending: "bg-sky-500 dark:bg-sky-600",
  completed: "bg-zinc-300 dark:bg-zinc-600",
};

export const DASHBOARD_SYNC_HEALTH_LINK_CLASS =
  "mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100";
