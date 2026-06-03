import {
  DASHBOARD_ATTENTION_PANEL_BODY_CLASS,
  DASHBOARD_ATTENTION_PANEL_CLASS,
  DASHBOARD_LINK_CLASS,
  DASHBOARD_LOADING_CLASS,
  DASHBOARD_SECTION_DESC_CLASS,
  DASHBOARD_SIDE_PANEL_BODY_CLASS,
  DASHBOARD_SIDE_PANEL_CLASS,
} from "../../constants";

export {
  DASHBOARD_SIDE_PANEL_CLASS as DASHBOARD_SYNC_HEALTH_PANEL_CLASS,
  DASHBOARD_SIDE_PANEL_BODY_CLASS as DASHBOARD_SYNC_HEALTH_PANEL_BODY_CLASS,
  DASHBOARD_SECTION_DESC_CLASS as DASHBOARD_SYNC_HEALTH_SUBTITLE_CLASS,
  DASHBOARD_LOADING_CLASS as DASHBOARD_SYNC_HEALTH_LOADING_CLASS,
  DASHBOARD_LINK_CLASS as DASHBOARD_SYNC_HEALTH_LINK_CLASS,
};

export const DASHBOARD_SYNC_HEALTH_TITLE_CLASS =
  "text-[15px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100";

export const SYNC_STATUS_BAR_CLASS: Record<string, string> = {
  failed: "bg-red-500/90 dark:bg-red-500",
  active: "bg-emerald-500/90 dark:bg-emerald-500",
  syncing: "bg-sky-500/80 dark:bg-sky-500",
  pending: "bg-sky-500/80 dark:bg-sky-500",
  completed: "bg-zinc-300 dark:bg-zinc-600",
};

export const DASHBOARD_SYNC_HEALTH_CALLOUT_CLASS =
  "mt-4 flex items-start gap-2 rounded-xl bg-amber-500/8 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200";

export const DASHBOARD_SYNC_HEALTH_BAR_TRACK_CLASS =
  "h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800";

export const DASHBOARD_SYNC_HEALTH_BAR_FILL_CLASS = "h-1.5 rounded-full transition-all";

export const DASHBOARD_SYNC_HEALTH_ROW_LABEL_CLASS =
  "text-xs text-zinc-600 dark:text-zinc-400";

export const DASHBOARD_SYNC_HEALTH_ROW_VALUE_CLASS =
  "text-xs tabular-nums text-zinc-400 dark:text-zinc-500";
