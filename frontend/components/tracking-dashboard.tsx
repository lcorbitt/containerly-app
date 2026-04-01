"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, TrackingRequest, Alert } from "@/types/database";
import { CreateOrgForm } from "@/components/create-org-form";
import { NewTrackingForm } from "@/components/new-tracking-form";

type OrgRow = {
  role: string;
  organizations: Organization | null;
};

export function TrackingDashboard({ initialOrgs }: { initialOrgs: OrgRow[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    initialOrgs[0]?.organizations?.id ?? null,
  );
  const [requests, setRequests] = useState<TrackingRequest[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const loadLists = useCallback(async () => {
    if (!selectedOrgId) return;
    const supabase = createClient();
    const [{ data: tr }, { data: al }] = await Promise.all([
      supabase
        .from("tracking_requests")
        .select("*")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("alerts")
        .select("*")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setRequests((tr as TrackingRequest[]) ?? []);
    setAlerts((al as Alert[]) ?? []);
  }, [selectedOrgId]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const onOrgCreated = useCallback((id: string) => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("organization_members")
        .select("role, organizations(id, name, slug, created_at, updated_at)")
        .eq("user_id", user.id);
      const rows: OrgRow[] = (data ?? []).map((row) => {
        const o = row.organizations;
        const org = Array.isArray(o) ? o[0] : o;
        return { role: row.role as string, organizations: org ?? null };
      });
      setOrgs(rows);
      setSelectedOrgId(id);
    })();
  }, []);

  const selectedOrg = orgs.find((o) => o.organizations?.id === selectedOrgId)?.organizations;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Containerly
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Logistics tracking backed by Supabase: RLS-isolated tenants, edge sync, and alerts.
        </p>
      </header>

      {orgs.length === 0 ? (
        <CreateOrgForm onCreated={onOrgCreated} />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500">Organization</span>
              <select
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                value={selectedOrgId ?? ""}
                onChange={(e) => setSelectedOrgId(e.target.value || null)}
              >
                {orgs.map((row) =>
                  row.organizations ? (
                    <option key={row.organizations.id} value={row.organizations.id}>
                      {row.organizations.name}
                    </option>
                  ) : null,
                )}
              </select>
            </label>
            <CreateOrgForm onCreated={onOrgCreated} />
          </div>

          {selectedOrgId ? (
            <div className="grid gap-6 md:grid-cols-2">
              <NewTrackingForm organizationId={selectedOrgId} onCreated={() => void loadLists()} />
              <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Recent alerts
                </h2>
                <ul className="flex flex-col gap-2 text-sm">
                  {alerts.length === 0 ? (
                    <li className="text-zinc-500">No alerts yet.</li>
                  ) : (
                    alerts.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                      >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {a.severity}
                        </span>
                        <span className="text-zinc-500"> · {a.alert_type}</span>
                        <p className="text-zinc-700 dark:text-zinc-300">{a.message}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          ) : null}

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Tracking requests
              </h2>
              <button
                type="button"
                onClick={() => void loadLists()}
                className="text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                    <th className="py-2 pr-4 font-medium">Container</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Last sync</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="py-2 pr-4 font-mono">{r.container_number}</td>
                      <td className="py-2 pr-4">{r.status}</td>
                      <td className="py-2 pr-4 text-zinc-500">
                        {r.last_sync_at
                          ? new Date(r.last_sync_at).toLocaleString()
                          : r.error_message ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 ? (
                <p className="py-4 text-sm text-zinc-500">No tracking requests yet.</p>
              ) : null}
            </div>
          </section>

          {selectedOrg ? (
            <p className="text-xs text-zinc-400">
              Active org: {selectedOrg.name} ({selectedOrg.slug})
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
