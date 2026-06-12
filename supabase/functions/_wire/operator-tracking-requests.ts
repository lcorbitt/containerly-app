/** Shared operator tracking-requests table params (browser + API routes; no DB). */
export type OperatorRequestScope = "all" | "mine" | "unassigned" | "participating";

export type SortDirection = "asc" | "desc";

export const OPERATOR_REQUEST_SORT_COLUMNS = [
  "container_number",
  "status",
  "created_at",
  "last_sync_at",
] as const;

export type OperatorRequestSortColumn = (typeof OPERATOR_REQUEST_SORT_COLUMNS)[number];

export function normalizeOperatorSortColumn(raw: string | null): OperatorRequestSortColumn {
  if (raw && (OPERATOR_REQUEST_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as OperatorRequestSortColumn;
  }
  return "created_at";
}
