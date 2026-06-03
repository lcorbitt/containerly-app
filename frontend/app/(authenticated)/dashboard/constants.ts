/** Shared dashboard surface, spacing, and typography. */

export const DASHBOARD_PAGE_CLASS =
  "mx-auto flex w-full max-w-[72rem] flex-col gap-10 px-6 py-8 lg:px-8";

export const DASHBOARD_PANEL_CLASS =
  "overflow-hidden rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800/90 dark:bg-zinc-950";

export const DASHBOARD_PANEL_BODY_CLASS = "p-6";

export const DASHBOARD_PAGE_INTRO_CLASS = "text-sm text-zinc-500 dark:text-zinc-400";

export const DASHBOARD_SECTION_TITLE_CLASS =
  "text-[15px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100";

export const DASHBOARD_SECTION_DESC_CLASS =
  "mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400";

export const DASHBOARD_EYEBROW_CLASS = "text-xs font-medium text-zinc-400 dark:text-zinc-500";

export const DASHBOARD_STAT_LABEL_CLASS = "text-xs text-zinc-500 dark:text-zinc-400";

export const DASHBOARD_STAT_VALUE_CLASS =
  "mt-1.5 text-2xl font-medium tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50";

export const DASHBOARD_STAT_META_CLASS =
  "mt-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500";

export const DASHBOARD_DIVIDE_CLASS = "divide-zinc-200/90 dark:divide-zinc-800/90";

export const DASHBOARD_MAIN_GRID_CLASS = "grid gap-6 lg:grid-cols-12 lg:items-stretch";

export const DASHBOARD_COL_FULL = "lg:col-span-12";

export const DASHBOARD_COL_MAIN = "lg:col-span-7";

export const DASHBOARD_COL_SIDE = "lg:col-span-5";

export const DASHBOARD_LINK_CLASS =
  "inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 underline-offset-4 transition-colors hover:text-primary-orange dark:text-zinc-100 dark:hover:text-primary-orange";

export const DASHBOARD_EMPTY_CLASS = "text-sm text-zinc-500 dark:text-zinc-400";

export const DASHBOARD_ATTENTION_ROW_HEIGHT = "min-h-[24rem]";

export const DASHBOARD_ATTENTION_PANEL_CLASS = `${DASHBOARD_PANEL_CLASS} flex h-full w-full ${DASHBOARD_ATTENTION_ROW_HEIGHT} flex-col`;

export const DASHBOARD_ATTENTION_PANEL_BODY_CLASS = `${DASHBOARD_PANEL_BODY_CLASS} flex min-h-0 flex-1 flex-col`;

/** Two equal panels stacked beside the action-items column. */
export const DASHBOARD_SIDE_STACK_CLASS = `flex h-full w-full ${DASHBOARD_ATTENTION_ROW_HEIGHT} flex-col gap-4`;

export const DASHBOARD_SIDE_PANEL_CLASS = `${DASHBOARD_PANEL_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden`;

export const DASHBOARD_SIDE_PANEL_BODY_CLASS = "flex min-h-0 flex-1 flex-col p-5";

export const DASHBOARD_LOADING_CLASS =
  "flex min-h-32 items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400";

export function dashboardStatValueToneClass(tone: "neutral" | "warn" | "bad" | "good"): string {
  switch (tone) {
    case "bad":
      return "text-red-600 dark:text-red-400";
    case "warn":
      return "text-amber-700 dark:text-amber-400";
    case "good":
      return "text-emerald-700 dark:text-emerald-400";
    default:
      return "";
  }
}
