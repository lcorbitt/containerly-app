"use client";

import type { OrganizationMemberRole } from "@/types/database";
import { OrganizationImageSettings } from "../OrganizationImageSettings";
import {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
} from "@/components/AdminTableSection";
import { useOrganizationSettingsPanel } from "./hooks/useOrganizationSettingsPanel";
import { formatMemberJoinedDate } from "./utils";

export type OrganizationSettingsPanelProps = {
  /** When true, omit top margin (used inside Settings tabs). */
  embedded?: boolean;
};

export function OrganizationSettingsPanel({ embedded = false }: OrganizationSettingsPanelProps) {
  const t = useOrganizationSettingsPanel(embedded);

  if (t.orgs.length === 0) {
    return (
      <section
        className={`${t.top} rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Organization
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          You are not in a freight organization. Organization settings appear when you belong to one.
        </p>
      </section>
    );
  }

  if (!t.org || !t.selectedOrgId) {
    return (
      <section
        className={`${t.top} rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Organization
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Select an organization in the header to manage its settings.
        </p>
      </section>
    );
  }

  const org = t.org;
  const statClass =
    "rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40";

  return (
    <section className={`${t.top} space-y-10`}>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Organization
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Settings for <span className="font-medium text-zinc-900 dark:text-zinc-100">{org.name}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Activity</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Counts for the active organization (RLS-scoped to what you can see).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className={statClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Carrier sync lines</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {t.metricsLoading ? "…" : t.metrics.trackingRequests ?? "—"}
            </p>
          </div>
          <div className={statClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Shipments</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {t.metricsLoading ? "…" : t.metrics.shipments ?? "—"}
            </p>
          </div>
          <div className={statClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Members</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {t.metricsLoading ? "…" : t.metrics.members ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {t.canManage ? (
        <>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <OrganizationImageSettings
              key={org.id}
              organizationId={org.id}
              organizationName={org.name}
              initialOrgImagePath={t.orgImagePath}
              onPathUpdated={(p) => {
                t.setOrgImagePath(p);
                void t.refreshOrgs();
              }}
            />
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Name &amp; URL slug</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              The slug must stay unique across all organizations.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:max-w-md">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Display name</span>
                <input
                  value={t.name}
                  onChange={(e) => t.setName(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Slug</span>
                <input
                  value={t.slug}
                  onChange={(e) => t.setSlug(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <button
                type="button"
                disabled={t.savingOrg}
                onClick={() => void t.saveOrganizationDetails()}
                className="w-fit rounded-lg border border-zinc-200 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {t.savingOrg ? "Saving…" : "Save organization"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Invite teammate</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              If they already have an account, they are added immediately. Otherwise we send a Supabase auth invite
              email, then add them to this organization.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Email</span>
                <input
                  type="email"
                  value={t.inviteEmail}
                  onChange={(e) => t.setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="flex w-full min-w-[8rem] flex-col gap-1 text-sm sm:w-36">
                <span className="text-zinc-600 dark:text-zinc-400">Role</span>
                <select
                  value={t.inviteRole}
                  onChange={(e) => t.setInviteRole(e.target.value as OrganizationMemberRole)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {t.ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={t.inviteBusy}
                onClick={() => void t.submitInvite()}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {t.inviteBusy ? "Working…" : "Add or Invite"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Members</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                People in this organization. Role changes apply immediately.
              </p>
            </div>
            {t.membersError ? (
              <p className="p-4 text-sm text-red-600 dark:text-red-400">{t.membersError}</p>
            ) : null}
            {t.membersLoading && t.members.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">Loading members…</p>
            ) : t.members.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">No members found.</p>
            ) : (
              <div className="max-h-[28rem] overflow-auto">
                <table className="w-full min-w-[44rem] table-fixed border-collapse text-left">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                    <col className="w-[12%]" />
                    <col className="w-[28%]" />
                    <col className="w-[12%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead>
                    <tr className={ADMIN_TABLE_HEAD_ROW}>
                      <th className={ADMIN_TABLE_TH}>Name</th>
                      <th className={ADMIN_TABLE_TH}>Email</th>
                      <th className={ADMIN_TABLE_TH}>Role</th>
                      <th className={ADMIN_TABLE_TH}>User ID</th>
                      <th className={ADMIN_TABLE_TH}>Joined</th>
                      <th className={ADMIN_TABLE_TH} />
                    </tr>
                  </thead>
                  <tbody>
                    {t.members.map((row) => {
                      const busy = t.pendingId === row.membershipId;
                      const isSelf = t.currentUserId === row.userId;
                      return (
                        <tr key={row.membershipId} className={ADMIN_TABLE_ROW}>
                          <td className={`${ADMIN_TABLE_TD} font-medium text-zinc-900 dark:text-zinc-100`}>
                            <span className="block truncate" title={row.fullName?.trim() || undefined}>
                              {row.fullName?.trim() || "—"}
                              {isSelf ? (
                                <span className="ml-1 text-xs font-normal text-zinc-500">(you)</span>
                              ) : null}
                            </span>
                          </td>
                          <td className={`${ADMIN_TABLE_TD} text-zinc-900 dark:text-zinc-100`}>
                            <span className="block truncate" title={row.email ?? undefined}>
                              {row.email ?? "—"}
                            </span>
                          </td>
                          <td className={ADMIN_TABLE_TD}>
                            <select
                              className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 disabled:opacity-60"
                              value={row.role}
                              disabled={busy}
                              aria-label={`Role for ${row.email ?? row.userId}`}
                              onChange={(e) => {
                                const next = e.target.value as OrganizationMemberRole;
                                if (next === row.role) return;
                                void t.updateMemberRole(row.membershipId, next);
                              }}
                            >
                              {t.ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className={`${ADMIN_TABLE_TD} font-mono text-xs text-zinc-600 dark:text-zinc-300`}>
                            <span className="block truncate" title={row.userId}>
                              {row.userId}
                            </span>
                          </td>
                          <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                            {formatMemberJoinedDate(row.createdAt)}
                          </td>
                          <td className={ADMIN_TABLE_TD}>
                            <button
                              type="button"
                              disabled={busy || isSelf}
                              title={isSelf ? "You can’t remove yourself here" : "Remove from organization"}
                              onClick={() => void t.removeMember(row.membershipId)}
                              className="text-xs font-medium text-red-600 underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 dark:text-red-400"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
