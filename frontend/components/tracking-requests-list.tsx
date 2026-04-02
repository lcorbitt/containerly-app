"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TrackingRequest } from "@/types/database";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { TrackingWorkflowStatusPill } from "@/components/status-pills";

export function TrackingRequestsList() {
  const router = useRouter();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const [requests, setRequests] = useState<TrackingRequest[]>([]);

  const loadRequests = useCallback(async () => {
    if (!selectedOrgId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("tracking_requests")
      .select("*")
      .eq("organization_id", selectedOrgId)
      .order("created_at", { ascending: false })
      .limit(100);
    setRequests((data as TrackingRequest[]) ?? []);
  }, [selectedOrgId]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const columns: DataTableColumn<TrackingRequest>[] = [
    {
      id: "container",
      header: "Container",
      cell: (r) => <span className="font-mono">{r.container_number}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <TrackingWorkflowStatusPill status={r.status} />,
    },
    {
      id: "last_sync",
      header: "Last sync",
      cell: (r) => (
        <span className="text-zinc-500">
          {r.last_sync_at
            ? new Date(r.last_sync_at).toLocaleString()
            : r.error_message ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Requests
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Open a request to view workspace, sync status, and shared reports. Create new tracking from{" "}
          <Link href="/dashboard" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Dashboard
          </Link>
          .
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
              <Link
                href="/admin/organizations"
                className="font-medium text-zinc-900 underline dark:text-zinc-100"
              >
                Platform → Organizations
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                All requests
              </h2>
              <button
                type="button"
                onClick={() => void loadRequests()}
                className="text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
              >
                Refresh
              </button>
            </div>
            {selectedOrgId ? (
              <DataTable
                columns={columns}
                rows={requests}
                getRowId={(r) => r.id}
                emptyMessage="No tracking requests yet."
                onRowClick={(r) => router.push(`/requests/${r.id}`)}
              />
            ) : (
              <p className="py-4 text-sm text-zinc-500">Select an organization to load requests.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
