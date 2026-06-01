export const DASHBOARD_KPI_GRID_CLASS = "grid gap-3 sm:grid-cols-2 xl:grid-cols-4";

export const DASHBOARD_KPI_CARD_BASE_CLASS =
  "rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950";

export function dashboardKpiCardRingClass(tone: "neutral" | "warn" | "bad" | "good"): string {
  switch (tone) {
    case "bad":
      return "border-red-200/80 dark:border-red-900/50";
    case "warn":
      return "border-amber-200/80 dark:border-amber-900/40";
    case "good":
      return "border-emerald-200/80 dark:border-emerald-900/40";
    default:
      return "border-zinc-200 dark:border-zinc-800";
  }
}

export const DASHBOARD_KPI_LABEL_CLASS =
  "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

export const DASHBOARD_KPI_VALUE_CLASS =
  "mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50";

export const DASHBOARD_KPI_SUB_CLASS = "mt-0.5 text-xs text-zinc-500 dark:text-zinc-400";

export const DASHBOARD_KPI_DOT_CLASS = "h-2 w-2 shrink-0 rounded-full";

export const DASHBOARD_KPI_DOT_COLORS = {
  active: "bg-sky-500",
  attention: "bg-primary-orange",
  completed: "bg-emerald-500",
  neutral: "bg-zinc-400",
} as const;
