import type { TriageBucketKey } from "@/utils/dashboard-metrics";

export type AlertsInboxFilter = "all" | TriageBucketKey;

export const ALERTS_INBOX_FILTERS: readonly {
  id: AlertsInboxFilter;
  label: string;
}[] = [
  { id: "all", label: "Needs Action" },
  { id: "exceptions", label: "Exceptions" },
  { id: "eta", label: "Delays" },
  { id: "docs", label: "Document Holds" },
  { id: "customer", label: "Customer Threads" },
];

export const ALERTS_INBOX_PANEL_CLASS =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

export const ALERTS_INBOX_FILTER_BUTTON_ACTIVE_CLASS =
  "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50";

export const ALERTS_INBOX_FILTER_BUTTON_INACTIVE_CLASS =
  "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100";

export const ALERTS_INBOX_LIST_CLASS = "divide-y divide-zinc-100 dark:divide-zinc-800";

export const ALERTS_ACCESS_REQUEST_ROW_CLASS =
  "block px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60";
