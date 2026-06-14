"use client";

import {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  AdminTableSection,
} from "@/components/AdminTableSection";
import { TextInput } from "@/components/TextInput";
import {
  CATEGORY_FILTER_OPTIONS,
  CATEGORY_LABELS,
  PAGE_SIZE_OPTIONS,
  STATUS_FILTER_OPTIONS,
  STATUS_OPTIONS,
} from "./constants";
import { useAdminFeedbackTable } from "./useAdminFeedbackTable";
import { formatFeedbackDate, formatSubmitter, truncateMessage } from "./utils";

export function AdminFeedbackTable() {
  const t = useAdminFeedbackTable();

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-0 max-w-md flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Search
          <TextInput
            type="search"
            value={t.search}
            onChange={(e) => t.setSearch(e.target.value)}
            placeholder="Message, user, org, or page URL…"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="flex w-full min-w-[10rem] max-w-[12rem] flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-44">
          Category
          <select
            value={t.categoryFilter}
            onChange={(e) => t.setCategoryFilter(e.target.value as typeof t.categoryFilter)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {CATEGORY_FILTER_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full min-w-[10rem] max-w-[12rem] flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-44">
          Status
          <select
            value={t.statusFilter}
            onChange={(e) => t.setStatusFilter(e.target.value as typeof t.statusFilter)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full min-w-[6rem] max-w-[8rem] flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-28">
          Page Size
          <select
            value={t.pageSize}
            onChange={(e) =>
              t.setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{t.summaryLine}</p>
    </div>
  );

  const pagination =
    t.filtered.length > 0 ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="tabular-nums text-zinc-600 dark:text-zinc-400">
          Rows <span className="font-medium text-zinc-800 dark:text-zinc-200">{t.pageRange}</span> of{" "}
          {t.filtered.length.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={t.safePage <= 1}
            onClick={() => t.setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-zinc-700"
          >
            Previous
          </button>
          <span className="min-w-[5rem] text-center text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
            {t.safePage} / {t.totalPages}
          </span>
          <button
            type="button"
            disabled={t.safePage >= t.totalPages}
            onClick={() => t.setPage((p) => Math.min(t.totalPages, p + 1))}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      </div>
    ) : null;

  return (
    <AdminTableSection
      title="User Feedback"
      description="Bug reports, feature requests, and general product feedback submitted from the in-app widget."
      toolbar={toolbar}
      footer={pagination}
    >
      {t.query.isLoading ? (
        <p className="p-6 text-sm text-zinc-500">Loading feedback…</p>
      ) : t.query.error ? (
        <p className="p-4 text-sm text-red-600 dark:text-red-400">
          {t.query.error instanceof Error ? t.query.error.message : "Failed to load feedback"}
        </p>
      ) : t.updateError ? (
        <p className="p-4 text-sm text-red-600 dark:text-red-400">{t.updateError}</p>
      ) : t.rows.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No feedback submissions yet.</p>
      ) : t.filtered.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No rows match your filters.</p>
      ) : (
        <table className="w-full min-w-[72rem] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[10rem]" />
            <col className="w-[8rem]" />
            <col className="w-[12rem]" />
            <col className="w-[10rem]" />
            <col />
            <col className="w-[12rem]" />
            <col className="w-[9rem]" />
          </colgroup>
          <thead>
            <tr className={ADMIN_TABLE_HEAD_ROW}>
              <th className={ADMIN_TABLE_TH}>Date</th>
              <th className={ADMIN_TABLE_TH}>Category</th>
              <th className={ADMIN_TABLE_TH}>User</th>
              <th className={ADMIN_TABLE_TH}>Organization</th>
              <th className={ADMIN_TABLE_TH}>Message</th>
              <th className={ADMIN_TABLE_TH}>Page</th>
              <th className={ADMIN_TABLE_TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {t.pageRows.map((row) => (
              <tr key={row.id} className={ADMIN_TABLE_ROW}>
                <td className={ADMIN_TABLE_TD}>
                  <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                    {formatFeedbackDate(row.created_at)}
                  </span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {CATEGORY_LABELS[row.category]}
                  </span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{formatSubmitter(row)}</span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {row.organization_name ?? "—"}
                  </span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200" title={row.message}>
                    {truncateMessage(row.message)}
                  </p>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <a
                    href={row.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                    title={row.page_url}
                  >
                    {row.page_url}
                  </a>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <select
                    value={row.status}
                    disabled={t.pendingId === row.id}
                    onChange={(e) =>
                      void t.updateStatus(row.id, e.target.value as typeof row.status)
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminTableSection>
  );
}
