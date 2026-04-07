"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLoading } from "@/components/PageLoading";
import { ShipmentWorkspaceScopePanel } from "../ShipmentWorkspaceScopePanel";
import { ContainerWorkspace } from "@/app/(authenticated)/containers/[containerId]/components/ContainerWorkspace";
import {
  pickTrackingRowsExported,
  type ShipmentOverviewRow,
  type ShipmentOverviewTrackingRow,
} from "@/services/shipment.service";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { TrackingWorkflowStatusPill } from "@/components/StatusPills";
import {
  shipmentWorkspaceRowQueryKeyRoot,
  useShipmentWorkspaceRowQuery,
} from "@/hooks/queries/useShipment";

type WorkspaceMode = "shipment" | "container";

function modeToggleClass(active: boolean) {
  return `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
    active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
  }`;
}

export function ShipmentWorkspace({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("shipment");

  const rowQuery = useShipmentWorkspaceRowQuery({ shipmentId, organizationId: selectedOrgId });

  const refetchShipment = useCallback(() => {
    if (selectedOrgId) {
      void qc.invalidateQueries({
        queryKey: [...shipmentWorkspaceRowQueryKeyRoot, shipmentId, selectedOrgId],
      });
    }
  }, [qc, shipmentId, selectedOrgId]);

  const row: ShipmentOverviewRow | null = useMemo(() => {
    const d = rowQuery.data;
    if (!d?.ok) return null;
    return d.row;
  }, [rowQuery.data]);

  const error =
    !selectedOrgId
      ? "Select an organization."
      : rowQuery.data && !rowQuery.data.ok
        ? rowQuery.data.error
        : rowQuery.error instanceof Error
          ? rowQuery.error.message
          : null;

  const loading = rowQuery.isLoading && Boolean(selectedOrgId);

  const lines = row ? pickTrackingRowsExported(row) : [];

  const activeContainerId = useMemo(() => {
    const want = searchParams.get("container")?.trim() ?? "";
    if (want && lines.some((l) => l.container_id === want)) return want;
    return lines.find((l) => l.container_id)?.container_id ?? null;
  }, [searchParams, lines]);

  useEffect(() => {
    if (workspaceMode !== "container" || !row || lines.length === 0) return;
    const want = searchParams.get("container")?.trim() ?? "";
    if (want && lines.some((l) => l.container_id === want)) return;
    const first = lines.find((l) => l.container_id)?.container_id;
    if (first) {
      router.replace(`${pathname}?container=${encodeURIComponent(first)}`, { scroll: false });
    }
  }, [workspaceMode, row, lines, searchParams, pathname, router]);

  const selectLine = useCallback(
    (containerId: string) => {
      router.replace(`${pathname}?container=${encodeURIComponent(containerId)}`, { scroll: false });
    },
    [pathname, router],
  );

  if (!selectedOrgId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Select an organization to view this shipment.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto box-border flex min-h-0 w-full max-w-6xl flex-1 flex-col p-6">
        <PageLoading loadingText="Loading shipment…" />
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Shipment unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{error ?? "Unknown error"}</p>
        <Link
          href="/shipments"
          className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Back to shipments
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Link
          href="/shipments"
          className="mb-6 inline-block text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            All shipments
          </span>
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{row.reference}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          No tracking lines yet. Add a container from Track or import a bill of lading.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-emerald-800 underline dark:text-emerald-300"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto box-border w-full max-w-6xl px-6 pt-6">
        <header className="mb-4 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Link
                  href="/shipments"
                  className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  All shipments
                </Link>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Shipment
                </p>
                <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                  {row.reference}
                </h1>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Choose shipment-wide tools or a specific container line.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link
                  href={`/shipments/hub/${shipmentId}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Shared customer view
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                </Link>
              </div>
            </div>

            <nav className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800" aria-label="Workspace scope">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Workspace
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("shipment")}
                  className={modeToggleClass(workspaceMode === "shipment")}
                >
                  Entire shipment
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("container")}
                  className={modeToggleClass(workspaceMode === "container")}
                >
                  Container line
                </button>
              </div>
            </nav>

            {workspaceMode === "container" && lines.length > 1 ? (
              <nav className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800" aria-label="Container lines">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Active line
                </p>
                <div className="flex flex-wrap gap-2">
                  {lines.map((tr) => {
                    const cid = tr.container_id;
                    if (!cid) return null;
                    const active = cid === activeContainerId;
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => selectLine(cid)}
                        className={
                          active
                            ? "inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        }
                      >
                        <span className="font-mono">#{tr.container_number}</span>
                        <TrackingWorkflowStatusPill status={tr.status} />
                      </button>
                    );
                  })}
                </div>
              </nav>
            ) : null}
          </div>
        </header>
      </div>

      {workspaceMode === "shipment" ? (
        <ShipmentWorkspaceScopePanel
          shipmentId={shipmentId}
          shipmentReference={row.reference}
          initialAssigneeUserId={row.assignee_user_id ?? null}
          onShipmentMetaChanged={refetchShipment}
        />
      ) : activeContainerId ? (
        <ContainerWorkspace
          key={activeContainerId}
          containerId={activeContainerId}
          shipmentEmbed={{ onSelectContainer: selectLine }}
        />
      ) : (
        <div className="px-6 py-8 text-sm text-zinc-600 dark:text-zinc-400">
          Pick a container line above.
        </div>
      )}
    </>
  );
}
