"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TrackingRequest, Alert } from "@/types/database";
import { MockJourneySimulator, shouldShowMockJourneyPanel } from "@/components/mock-journey-simulator";
import { NewTrackingForm } from "@/components/new-tracking-form";
import { TrackingWorkflowStatusPill } from "@/components/status-pills";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";

export function TrackingDashboard() {
  const router = useRouter();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
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

  const selectedOrg = orgs.find((o) => o.organizations?.id === selectedOrgId)?.organizations;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Logistics tracking backed by Supabase: RLS-isolated tenants, edge sync, and alerts.
        </p>
      </header>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You are not a member of any organization yet.
          </p>
          {isSuperAdmin ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              As platform superadmin you still pick an org for context, or create one under{" "}
              <Link href="/admin/organizations" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                Platform → Organizations
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <>
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

          {shouldShowMockJourneyPanel() && selectedOrgId ? (
            <MockJourneySimulator
              organizationId={selectedOrgId}
              requests={requests}
              onComplete={() => void loadLists()}
            />
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
                    <th className="py-2 pr-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open tracking request ${r.container_number}`}
                      className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                      onClick={() => router.push(`/requests/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/requests/${r.id}`);
                        }
                      }}
                    >
                      <td className="py-2 pr-4 font-mono">{r.container_number}</td>
                      <td className="py-2 pr-4">
                        <TrackingWorkflowStatusPill status={r.status} />
                      </td>
                      <td className="py-2 pr-4 text-zinc-500">
                        {r.last_sync_at
                          ? new Date(r.last_sync_at).toLocaleString()
                          : r.error_message ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/requests/${r.id}`}
                          className="text-xs font-medium text-zinc-900 underline dark:text-zinc-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Details
                        </Link>
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
