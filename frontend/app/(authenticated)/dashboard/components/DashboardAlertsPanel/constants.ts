import {
  DASHBOARD_EMPTY_CLASS,
  DASHBOARD_LOADING_CLASS,
  DASHBOARD_PANEL_BODY_CLASS,
  DASHBOARD_PANEL_CLASS,
  DASHBOARD_SECTION_DESC_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "../../constants";

export {
  DASHBOARD_PANEL_CLASS as DASHBOARD_ALERTS_PANEL_CLASS,
  DASHBOARD_PANEL_BODY_CLASS as DASHBOARD_ALERTS_PANEL_BODY_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
  DASHBOARD_SECTION_DESC_CLASS,
  DASHBOARD_EMPTY_CLASS,
  DASHBOARD_LOADING_CLASS as DASHBOARD_ALERTS_LOADING_CLASS,
};

export const DASHBOARD_ALERTS_LIST_CLASS =
  "divide-y divide-zinc-200/90 dark:divide-zinc-800/90";

export const DASHBOARD_ALERTS_ROW_CLASS =
  "group flex items-start justify-between gap-4 py-3.5 transition-colors first:pt-0 last:pb-0";

export const DASHBOARD_ALERTS_TAG_CLASS =
  "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium";

export const DASHBOARD_ALERTS_TAG_CRITICAL_CLASS =
  "bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/15";

export const DASHBOARD_ALERTS_TAG_WARNING_CLASS =
  "bg-amber-500/10 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";

export const DASHBOARD_ALERTS_TAG_INFO_CLASS =
  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

export const DASHBOARD_ALERTS_MAX_ROWS = 12;
