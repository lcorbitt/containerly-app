"use client";

import { useAdminTenantInvitesQuery } from "@/hooks/queries/useAdminTenantInvites";
import {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
} from "@/components/AdminTableSection";

export function AdminTenantInvitesTable() {
  const query = useAdminTenantInvitesQuery();
  const rows = query.data ?? [];

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Tenant Invites</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Recent new-tenant invites sent from this platform.
      </p>

      {query.isLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No tenant invites yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={ADMIN_TABLE_HEAD_ROW}>
                <th className={ADMIN_TABLE_TH}>Email</th>
                <th className={ADMIN_TABLE_TH}>Suggested Name</th>
                <th className={ADMIN_TABLE_TH}>Status</th>
                <th className={ADMIN_TABLE_TH}>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={ADMIN_TABLE_ROW}>
                  <td className={ADMIN_TABLE_TD}>{row.email}</td>
                  <td className={ADMIN_TABLE_TD}>{row.suggestedOrgName ?? "—"}</td>
                  <td className={ADMIN_TABLE_TD}>
                    {row.status === "pending"
                      ? "Pending"
                      : row.status === "accepted"
                        ? "Accepted"
                        : "Revoked"}
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
