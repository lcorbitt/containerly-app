export const APPROVAL_STATUS_PILL_CLASS: Record<string, string> = {
  pending:
    "inline-flex shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-950 dark:border-amber-900/45 dark:bg-amber-950/30 dark:text-amber-200",
  approved:
    "inline-flex shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-950 dark:border-emerald-900/45 dark:bg-emerald-950/30 dark:text-emerald-200",
  rejected:
    "inline-flex shrink-0 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-950 dark:border-red-900/45 dark:bg-red-950/30 dark:text-red-200",
};

export const DEFAULT_APPROVAL_STATUS_PILL_CLASS =
  "inline-flex shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300";

export const REJECTION_REASON_CLASS =
  "mt-1 line-clamp-2 text-[10px] leading-snug text-red-700 dark:text-red-300";

export const FILE_COUNT_CLASS =
  "text-[10px] font-medium text-zinc-500 dark:text-zinc-400";

export const DOCUMENT_FILE_LIST_CLASS = "mt-1 space-y-0.5";

export const DOCUMENT_FILE_LIST_ITEM_CLASS =
  "truncate text-[10px] leading-snug text-zinc-600 dark:text-zinc-400";

export const DOCUMENT_FILE_LIST_MORE_CLASS =
  "text-[10px] font-medium text-zinc-500 dark:text-zinc-500";

/** Max file names shown on a compact timeline card before "+ N more". */
export const TIMELINE_DOCUMENT_PREVIEW_LIMIT = 3;

