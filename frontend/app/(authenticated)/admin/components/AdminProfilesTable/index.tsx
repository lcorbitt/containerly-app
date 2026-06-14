"use client";

import {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  AdminTableSection,
} from "@/components/AdminTableSection";
import { TextInput } from "@/components/TextInput";
import type { Profile } from "@/types/database";
import { PAGE_SIZE_OPTIONS, ROLE_OPTIONS } from "./constants";
import { useAdminProfilesTable } from "./hooks/useAdminProfilesTable";
import type { AdminProfileRow } from "./utils";

export type { AdminProfileRow };

export function AdminProfilesTable({
  initialProfiles,
  currentUserId,
}: {
  initialProfiles: AdminProfileRow[];
  currentUserId: string;
}) {
  const t = useAdminProfilesTable(initialProfiles, currentUserId);

  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex min-w-0 max-w-md flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Search
          <TextInput
            type="search"
            value={t.search}
            onChange={(e) => t.setSearch(e.target.value)}
            placeholder="Name, email, user ID, or organization…"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
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
      title="Platform accounts"
      description={
        <>
          Global flag <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">profiles.role</code> —{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">superadmin</code> bypasses tenant RLS.
          Not an organization role.
        </>
      }
      toolbar={toolbar}
      footer={
        <>
          {pagination}
          <p className="mt-2 text-zinc-500">
            Your own row is read-only so you cannot remove your platform superadmin access by accident.
          </p>
        </>
      }
    >
      {t.updateError ? (
        <p className="p-4 text-sm text-red-600 dark:text-red-400">{t.updateError}</p>
      ) : t.profiles.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No profiles yet.</p>
      ) : t.filtered.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No rows match your search.</p>
      ) : (
        <table className="w-full min-w-[64rem] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className={ADMIN_TABLE_HEAD_ROW}>
              <th className={ADMIN_TABLE_TH}>Full name</th>
              <th className={ADMIN_TABLE_TH}>Email</th>
              <th className={ADMIN_TABLE_TH}>Organization</th>
              <th className={ADMIN_TABLE_TH}>User ID</th>
              <th className={ADMIN_TABLE_TH}>Platform role</th>
              <th className={ADMIN_TABLE_TH}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {t.pageRows.map((row) => {
              const isSelf = row.id === t.currentUserId;
              const busy = t.pendingId === row.id;
              return (
                <tr key={row.id} className={ADMIN_TABLE_ROW}>
                  <td className={`${ADMIN_TABLE_TD} text-zinc-900 dark:text-zinc-100`}>
                    <span className="block truncate" title={row.full_name?.trim() || undefined}>
                      {row.full_name?.trim() || "—"}
                    </span>
                  </td>
                  <td className={`${ADMIN_TABLE_TD} text-zinc-900 dark:text-zinc-100`}>
                    <span className="block truncate" title={row.email ?? undefined}>
                      {row.email ?? "—"}
                    </span>
                  </td>
                  <td className={`${ADMIN_TABLE_TD} text-zinc-800 dark:text-zinc-200`}>
                    <span
                      className="block truncate text-sm"
                      title={row.organizations_label === "—" ? undefined : row.organizations_label}
                    >
                      {row.organizations_label}
                    </span>
                  </td>
                  <td className={`${ADMIN_TABLE_TD} font-mono text-xs text-zinc-600 dark:text-zinc-300`}>
                    <span className="block truncate" title={row.id}>
                      {row.id}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <select
                      className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                      value={row.role}
                      disabled={isSelf || busy}
                      title={
                        isSelf ? "You cannot change your own role from this screen." : undefined
                      }
                      aria-label={`Platform role for ${row.email ?? row.id}`}
                      onChange={(e) => {
                        const next = e.target.value as Profile["role"];
                        if (next === row.role) return;
                        void t.updateRole(row.id, next);
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
                    {new Date(row.created_at).toLocaleString()}
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
