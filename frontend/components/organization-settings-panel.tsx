"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { canManageOrganizationSettings } from "@/lib/org-role";
import { OrganizationImageSettings } from "@/components/organization-image-settings";
import { useToast } from "@/contexts/toast";
import type { OrganizationMemberRole } from "@/types/database";
import {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
} from "@/components/admin-table-section";

function slugFromName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
}

type MemberRow = {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: OrganizationMemberRole;
  createdAt: string;
};

const ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "member"];

function formatJoinedDate(iso: string): string {
  return iso.slice(0, 10);
}

type OrganizationSettingsPanelProps = {
  /** When true, omit top margin (used inside Settings tabs). */
  embedded?: boolean;
};

export function OrganizationSettingsPanel({ embedded = false }: OrganizationSettingsPanelProps) {
  const { toast } = useToast();
  const { orgs, selectedOrgId, isSuperAdmin, refreshOrgs } = useOrganizationWorkspace();

  const selectedRow = useMemo(
    () => orgs.find((r) => r.organizations?.id === selectedOrgId),
    [orgs, selectedOrgId],
  );
  const org = selectedRow?.organizations ?? null;
  const membershipRole = selectedRow?.role ?? null;

  const canManage = canManageOrganizationSettings(isSuperAdmin, membershipRole);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgImagePath, setOrgImagePath] = useState<string | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);

  const [metrics, setMetrics] = useState<{
    trackingRequests: number | null;
    shipments: number | null;
    members: number | null;
  }>({ trackingRequests: null, shipments: null, members: null });
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationMemberRole>("member");
  const [inviteBusy, setInviteBusy] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setSlug(org.slug);
      setOrgImagePath(org.org_image_path ?? null);
    }
  }, [org?.id, org?.name, org?.slug, org?.org_image_path]);

  const loadMetrics = useCallback(async () => {
    if (!selectedOrgId) return;
    setMetricsLoading(true);
    try {
      const [tr, sh, mem] = await Promise.all([
        supabase
          .from("tracking_requests")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", selectedOrgId),
        supabase
          .from("shipments")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", selectedOrgId),
        supabase
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", selectedOrgId),
      ]);
      setMetrics({
        trackingRequests: tr.count ?? null,
        shipments: sh.count ?? null,
        members: mem.count ?? null,
      });
    } finally {
      setMetricsLoading(false);
    }
  }, [supabase, selectedOrgId]);

  const loadMembers = useCallback(async () => {
    if (!selectedOrgId) return;
    setMembersLoading(true);
    setMembersError(null);
    try {
      const { data: mRows, error: mErr } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: true });

      if (mErr) throw mErr;
      const list = mRows ?? [];
      const userIds = [...new Set(list.map((m) => m.user_id))];
      if (userIds.length === 0) {
        setMembers([]);
        return;
      }

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (pErr) throw pErr;
      const profileByUser = new Map(
        (profiles ?? []).map((p) => [
          p.id,
          { email: p.email as string | null, fullName: (p.full_name as string | null) ?? null },
        ]),
      );

      setMembers(
        list.map((m) => {
          const prof = profileByUser.get(m.user_id);
          return {
            membershipId: m.id,
            userId: m.user_id,
            fullName: prof?.fullName ?? null,
            email: prof?.email ?? null,
            role: m.role as OrganizationMemberRole,
            createdAt: m.created_at,
          };
        }),
      );
    } catch (e) {
      setMembersError(e instanceof Error ? e.message : "Failed to load members");
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [supabase, selectedOrgId]);

  useEffect(() => {
    void loadMetrics();
    void loadMembers();
  }, [loadMetrics, loadMembers]);

  async function saveOrganizationDetails() {
    if (!org || !canManage) return;
    const n = name.trim();
    const s = slug.trim() || slugFromName(n);
    if (!n) {
      toast("Organization name is required.", "error");
      return;
    }
    setSavingOrg(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: n, slug: s })
        .eq("id", org.id);
      if (error) throw new Error(error.message);
      await refreshOrgs();
      toast("Organization details saved", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save organization", "error");
    } finally {
      setSavingOrg(false);
    }
  }

  async function updateMemberRole(membershipId: string, role: OrganizationMemberRole) {
    setPendingId(membershipId);
    setMembersError(null);
    try {
      const res = await fetch(`/api/organization-members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = (await res.json()) as { membership?: { role: string }; error?: string };
      if (!res.ok) throw new Error(payload.error ?? res.statusText);
      if (payload.membership) {
        setMembers((prev) =>
          prev.map((r) =>
            r.membershipId === membershipId
              ? { ...r, role: payload.membership!.role as OrganizationMemberRole }
              : r,
          ),
        );
      }
      void loadMetrics();
    } catch (e) {
      setMembersError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  async function removeMember(membershipId: string) {
    if (!canManage) return;
    if (!window.confirm("Remove this person from the organization?")) return;
    setPendingId(membershipId);
    setMembersError(null);
    try {
      const { error } = await supabase.from("organization_members").delete().eq("id", membershipId);
      if (error) throw new Error(error.message);
      setMembers((prev) => prev.filter((r) => r.membershipId !== membershipId));
      toast("Member removed", "success");
      void loadMetrics();
    } catch (e) {
      setMembersError(e instanceof Error ? e.message : "Could not remove member");
    } finally {
      setPendingId(null);
    }
  }

  async function submitInvite() {
    if (!selectedOrgId || !canManage) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      toast("Enter a valid email address.", "error");
      return;
    }
    setInviteBusy(true);
    try {
      const res = await fetch("/api/organization-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: selectedOrgId,
          email,
          role: inviteRole,
        }),
      });
      const payload = (await res.json()) as {
        membership?: { id: string };
        invited?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? res.statusText);
      setInviteEmail("");
      toast(
        payload.invited
          ? "Invite sent — they’re on the roster; they finish signup from the email link."
          : "Member added to this organization.",
        "success",
      );
      await loadMembers();
      void loadMetrics();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not add member", "error");
    } finally {
      setInviteBusy(false);
    }
  }

  const top = embedded ? "mt-0" : "mt-10";

  if (orgs.length === 0) {
    return (
      <section className={`${top} rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950`}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Organization
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          You are not in a freight organization. Organization settings appear when you belong to one.
        </p>
      </section>
    );
  }

  if (!org || !selectedOrgId) {
    return (
      <section className={`${top} rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950`}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Organization
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Select an organization in the header to manage its settings.
        </p>
      </section>
    );
  }

  const statClass =
    "rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40";

  return (
    <section className={`${top} space-y-10`}>
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
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tracking requests</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {metricsLoading ? "…" : metrics.trackingRequests ?? "—"}
            </p>
          </div>
          <div className={statClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Shipments</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {metricsLoading ? "…" : metrics.shipments ?? "—"}
            </p>
          </div>
          <div className={statClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Members</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {metricsLoading ? "…" : metrics.members ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {canManage ? (
        <>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <OrganizationImageSettings
              key={org.id}
              organizationId={org.id}
              organizationName={org.name}
              initialOrgImagePath={orgImagePath}
              onPathUpdated={(p) => {
                setOrgImagePath(p);
                void refreshOrgs();
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Slug</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <button
                type="button"
                disabled={savingOrg}
                onClick={() => void saveOrganizationDetails()}
                className="w-fit rounded-lg border border-zinc-200 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {savingOrg ? "Saving…" : "Save organization"}
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
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="flex w-full min-w-[8rem] flex-col gap-1 text-sm sm:w-36">
                <span className="text-zinc-600 dark:text-zinc-400">Role</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrganizationMemberRole)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={inviteBusy}
                onClick={() => void submitInvite()}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {inviteBusy ? "Working…" : "Add or invite"}
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
            {membersError ? (
              <p className="p-4 text-sm text-red-600 dark:text-red-400">{membersError}</p>
            ) : null}
            {membersLoading && members.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">Loading members…</p>
            ) : members.length === 0 ? (
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
                    {members.map((row) => {
                      const busy = pendingId === row.membershipId;
                      const isSelf = currentUserId === row.userId;
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
                                void updateMemberRole(row.membershipId, next);
                              }}
                            >
                              {ROLE_OPTIONS.map((r) => (
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
                            {formatJoinedDate(row.createdAt)}
                          </td>
                          <td className={ADMIN_TABLE_TD}>
                            <button
                              type="button"
                              disabled={busy || isSelf}
                              title={isSelf ? "You can’t remove yourself here" : "Remove from organization"}
                              onClick={() => void removeMember(row.membershipId)}
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
