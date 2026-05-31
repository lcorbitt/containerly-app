"use client";

import {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  AdminTableSection,
} from "@/components/AdminTableSection";
import { TextInput } from "@/components/TextInput";
import type { OrganizationMemberRole } from "@/types/database";
import {
  PAGE_SIZE_OPTIONS,
  ROLE_OPTIONS,
  useAdminOrgMembersTable,
} from "./hooks/useAdminOrgMembersTable";

export function AdminOrgMembersTable() {
  const t = useAdminOrgMembersTable();
  const patchErr =
    t.patchMutationError instanceof Error ? t.patchMutationError.message : null;
  const displayError = t.error ?? patchErr;

  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex min-w-0 max-w-md flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Search
          <TextInput
            type="search"
            value={t.search}
            onChange={(e) => t.setSearch(e.target.value)}
            placeholder="Organization, name, email, or user ID…"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="flex w-full min-w-[10rem] max-w-xs flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-48">
          Organization
          <select
            value={t.orgFilter}
            onChange={(e) => t.setOrgFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">All organizations ({t.orgOptions.length})</option>
            {t.orgOptions.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full min-w-[6rem] max-w-[8rem] flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-28">
          Page size
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
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <p className="self-center text-xs tabular-nums text-zinc-500 dark:text-zinc-400 sm:mr-2">
          {t.summaryLine}
        </p>
        <button
          type="button"
          onClick={() => void t.refetch()}
          disabled={t.loading}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t.loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
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
      title="Organization members"
      description={
        <>
          One row per user per organization. Roles are{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">organization_members</code>, not{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">profiles</code>.
        </>
      }
      toolbar={toolbar}
      footer={
        <>
          {pagination}
          <p className="mt-2 text-zinc-500">
            For very large datasets, add server-side pagination and search later; this UI keeps the browser responsive
            with client filters and pages.
          </p>
        </>
      }
    >
      {displayError ? (
        <p className="p-4 text-sm text-red-600 dark:text-red-400">{displayError}</p>
      ) : t.loading && t.rowsLength === 0 ? (
        <p className="p-6 text-sm text-zinc-500">Loading members…</p>
      ) : t.rowsLength === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No organization memberships yet.</p>
      ) : t.filtered.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No rows match your filters.</p>
      ) : (
        <table className="w-full min-w-[60rem] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[10%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className={ADMIN_TABLE_HEAD_ROW}>
              <th className={ADMIN_TABLE_TH}>Full name</th>
              <th className={ADMIN_TABLE_TH}>Email</th>
              <th className={ADMIN_TABLE_TH}>Organization</th>
              <th className={ADMIN_TABLE_TH}>User ID</th>
              <th className={ADMIN_TABLE_TH}>Org role</th>
              <th className={ADMIN_TABLE_TH}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {t.pageRows.map((row) => {
              const busy = t.pendingId === row.membershipId;
              return (
                <tr key={row.membershipId} className={ADMIN_TABLE_ROW}>
                  <td className={`${ADMIN_TABLE_TD} font-medium text-zinc-900 dark:text-zinc-100`}>
                    <span className="block truncate" title={row.fullName?.trim() || undefined}>
                      {row.fullName?.trim() || "—"}
                    </span>
                  </td>
                  <td className={`${ADMIN_TABLE_TD} text-zinc-900 dark:text-zinc-100`}>
                    <span className="block truncate" title={row.email ?? undefined}>
                      {row.email ?? "—"}
                    </span>
                  </td>
                  <td className={`${ADMIN_TABLE_TD} font-medium text-zinc-900 dark:text-zinc-100`}>
                    <span className="block truncate" title={row.organizationName}>
                      {row.organizationName}
                    </span>
                  </td>
                  <td className={`${ADMIN_TABLE_TD} font-mono text-xs text-zinc-600 dark:text-zinc-300`}>
                    <span className="block truncate" title={row.userId}>
                      {row.userId}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <select
                      className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 disabled:opacity-60"
                      value={row.role}
                      disabled={busy}
                      aria-label={`Org role for ${row.fullName?.trim() || row.email || row.userId}`}
                      onChange={(e) => {
                        const next = e.target.value as OrganizationMemberRole;
                        if (next === row.role) return;
                        t.updateRole(row.membershipId, next);
                      }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </AdminTableSection>
  );
}
