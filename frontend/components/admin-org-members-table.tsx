"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  AdminTableSection,
} from "@/components/admin-table-section";
import type { OrganizationMemberRole } from "@/types/database";

type Row = {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  email: string | null;
  role: OrganizationMemberRole;
  createdAt: string;
};

const ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "member"];
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

function matchesSearch(row: Row, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    row.organizationName.toLowerCase().includes(s) ||
    (row.email?.toLowerCase().includes(s) ?? false) ||
    row.userId.toLowerCase().includes(s)
  );
}

export function AdminOrgMembersTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: members, error: mErr } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at, organization_id, organizations(id, name)")
        .order("created_at", { ascending: true });

      if (mErr) throw mErr;
      const list = members ?? [];
      const userIds = [...new Set(list.map((m) => m.user_id))];
      if (userIds.length === 0) {
        setRows([]);
        return;
      }

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (pErr) throw pErr;
      const emailByUser = new Map((profiles ?? []).map((p) => [p.id, p.email as string | null]));

      setRows(
        list.map((m) => {
          const o = m.organizations as { id: string; name: string } | { id: string; name: string }[] | null;
          const org = Array.isArray(o) ? o[0] : o;
          return {
            membershipId: m.id,
            organizationId: m.organization_id,
            organizationName: org?.name ?? "—",
            userId: m.user_id,
            email: emailByUser.get(m.user_id) ?? null,
            role: m.role as OrganizationMemberRole,
            createdAt: m.created_at,
          };
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, orgFilter, pageSize]);

  async function updateRole(membershipId: string, role: OrganizationMemberRole) {
    setError(null);
    setPendingId(membershipId);
    try {
      const res = await fetch(`/api/organization-members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = (await res.json()) as {
        membership?: { id: string; role: string };
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? res.statusText);
      if (payload.membership) {
        setRows((prev) =>
          prev.map((r) =>
            r.membershipId === membershipId
              ? { ...r, role: payload.membership!.role as OrganizationMemberRole }
              : r,
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const byOrg = a.organizationName.localeCompare(b.organizationName);
        if (byOrg !== 0) return byOrg;
        return (a.email ?? a.userId).localeCompare(b.email ?? b.userId);
      }),
    [rows],
  );

  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      map.set(r.organizationId, r.organizationName);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    return sorted.filter((row) => {
      if (orgFilter !== "all" && row.organizationId !== orgFilter) return false;
      return matchesSearch(row, search);
    });
  }, [sorted, search, orgFilter]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filtered.length / pageSize));
    setPage((p) => Math.min(p, tp));
  }, [filtered.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize],
  );

  const summaryLine =
    filtered.length === sorted.length
      ? `${sorted.length.toLocaleString()} membership${sorted.length === 1 ? "" : "s"}`
      : `${filtered.length.toLocaleString()} of ${sorted.length.toLocaleString()} memberships`;

  const pageRange =
    filtered.length === 0
      ? "0–0"
      : `${(pageStart + 1).toLocaleString()}–${Math.min(pageStart + pageSize, filtered.length).toLocaleString()}`;

  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex min-w-0 max-w-md flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Organization, email, or user ID…"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="flex w-full min-w-[10rem] max-w-xs flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-48">
          Organization
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">All organizations ({orgOptions.length})</option>
            {orgOptions.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full min-w-[6rem] max-w-[8rem] flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-28">
          Page size
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
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
        <p className="self-center text-xs tabular-nums text-zinc-500 dark:text-zinc-400 sm:mr-2">{summaryLine}</p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );

  const pagination =
    filtered.length > 0 ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="tabular-nums text-zinc-600 dark:text-zinc-400">
          Rows <span className="font-medium text-zinc-800 dark:text-zinc-200">{pageRange}</span> of{" "}
          {filtered.length.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-zinc-700"
          >
            Previous
          </button>
          <span className="min-w-[5rem] text-center text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
      {error ? (
        <p className="p-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : loading && rows.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">Loading members…</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No organization memberships yet.</p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No rows match your filters.</p>
      ) : (
        <table className="w-full min-w-[52rem] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[26%]" />
            <col className="w-[12%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className={ADMIN_TABLE_HEAD_ROW}>
            <th className={ADMIN_TABLE_TH}>Email</th>
              <th className={ADMIN_TABLE_TH}>Organization</th>
              <th className={ADMIN_TABLE_TH}>User ID</th>
              <th className={ADMIN_TABLE_TH}>Org role</th>
              <th className={ADMIN_TABLE_TH}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const busy = pendingId === row.membershipId;
              return (
                <tr key={row.membershipId} className={ADMIN_TABLE_ROW}>
                  <td className={`${ADMIN_TABLE_TD} font-medium text-zinc-900 dark:text-zinc-100`}>
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
                      aria-label={`Org role for ${row.email ?? row.userId}`}
                      onChange={(e) => {
                        const next = e.target.value as OrganizationMemberRole;
                        if (next === row.role) return;
                        void updateRole(row.membershipId, next);
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
