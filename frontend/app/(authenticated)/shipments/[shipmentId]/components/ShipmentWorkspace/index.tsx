"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLoading } from "@/components/PageLoading";
import { ShipmentWorkspaceScopePanel } from "../ShipmentWorkspaceScopePanel";
import { ShipmentAccessSidebar } from "../ShipmentAccessSidebar";
import { ShipmentMailTrackingPanel } from "../ShipmentMailTrackingPanel";
import { ShipmentCarrierTrackingPanel } from "../ShipmentCarrierTrackingPanel";
import { ContainerWorkspace } from "@/app/(authenticated)/containers/[containerId]/components/ContainerWorkspace";
import { ShipmentHeaderInfo } from "../ShipmentHeaderInfo";
import { ShipmentDetailsCard } from "../ShipmentHeaderInfo/ShipmentDetailsCard";
import { EditShipmentDetailsModal } from "../ShipmentHeaderInfo/EditShipmentDetailsModal";
import { ShipmentTitleHeading } from "../ShipmentHeaderInfo/ShipmentTitleHeading";
import {
  pickTrackingRowsExported,
  type ShipmentWorkspaceRow,
  type ShipmentOverviewTrackingRow,
} from "@/services/shipment.service";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { TrackingWorkflowStatusPill } from "@/components/StatusPills";
import {
  shipmentWorkspaceRowQueryKeyRoot,
  useShipmentWorkspaceRowQuery,
} from "@/hooks/queries/useShipment";

type WorkspaceMode = "shipment" | "container";

function ShipmentWorkspaceLayout({
  detailsCard,
  workspaceContent,
  sidebar,
}: {
  detailsCard: React.ReactNode;
  workspaceContent?: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        {detailsCard}
        {workspaceContent}
      </div>
      <aside className="min-w-0">{sidebar}</aside>
    </div>
  );
}

function ShipmentWorkspacePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto box-border w-full max-w-6xl px-6 pb-6 pt-6">{children}</div>
  );
}

export function ShipmentWorkspace({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("shipment");
  const [editOpen, setEditOpen] = useState(false);

  const rowQuery = useShipmentWorkspaceRowQuery({ shipmentId, organizationId: selectedOrgId });

  const refetchShipment = useCallback(() => {
    if (selectedOrgId) {
      void qc.invalidateQueries({
        queryKey: [...shipmentWorkspaceRowQueryKeyRoot, shipmentId, selectedOrgId],
      });
    }
  }, [qc, shipmentId, selectedOrgId]);

  const row: ShipmentWorkspaceRow | null = useMemo(() => {
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

  const editModal = selectedOrgId ? (
    <EditShipmentDetailsModal
      open={editOpen}
      onClose={() => setEditOpen(false)}
      organizationId={selectedOrgId}
      shipmentId={shipmentId}
      source={row}
      onSaved={refetchShipment}
    />
  ) : null;

  if (lines.length === 0) {
    return (
      <ShipmentWorkspacePageShell>
        <ShipmentWorkspaceLayout
          detailsCard={
            <ShipmentDetailsCard
              createdAt={row.created_at}
              creatorName={row.creator_display_name}
              onEdit={() => setEditOpen(true)}
              editModal={editModal}
            >
              <ShipmentTitleHeading row={row} />
              <ShipmentHeaderInfo row={row} />
              <div className="mt-4 flex flex-col gap-3">
                <ShipmentCarrierTrackingPanel
                  shipmentId={shipmentId}
                  organizationId={selectedOrgId!}
                  workflowStatus={row.workflow_status ?? undefined}
                  onEnabled={refetchShipment}
                />
                <ShipmentMailTrackingPanel
                  shipmentId={shipmentId}
                  workflowStatus={row.workflow_status ?? undefined}
                  initialTrackingNumber={row.physical_mail_tracking_number ?? undefined}
                  onSaved={refetchShipment}
                />
              </div>
            </ShipmentDetailsCard>
          }
          workspaceContent={<ShipmentWorkspaceScopePanel shipmentId={shipmentId} />}
          sidebar={
            <ShipmentAccessSidebar
              shipmentId={shipmentId}
              initialAssigneeUserId={row.assignee_user_id ?? null}
              onMetaChanged={refetchShipment}
            />
          }
        />
      </ShipmentWorkspacePageShell>
    );
  }

  return (
    <ShipmentWorkspacePageShell>
      <ShipmentWorkspaceLayout
        detailsCard={
          <ShipmentDetailsCard
            createdAt={row.created_at}
            creatorName={row.creator_display_name}
            onEdit={() => setEditOpen(true)}
            editModal={editModal}
          >
            <ShipmentTitleHeading row={row} />
            <ShipmentHeaderInfo row={row} />

            {workspaceMode === "container" && lines.length > 1 ? (
              <nav className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800" aria-label="Carrier lines">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Active carrier line
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
          </ShipmentDetailsCard>
        }
        workspaceContent={
          workspaceMode === "shipment" ? (
            <ShipmentWorkspaceScopePanel shipmentId={shipmentId} />
          ) : activeContainerId ? (
            <ContainerWorkspace
              key={activeContainerId}
              containerId={activeContainerId}
              shipmentEmbed={{ onSelectContainer: selectLine }}
            />
          ) : (
            <p className="py-8 text-sm text-zinc-600 dark:text-zinc-400">Pick a container line above.</p>
          )
        }
        sidebar={
          <ShipmentAccessSidebar
            shipmentId={shipmentId}
            initialAssigneeUserId={row.assignee_user_id ?? null}
            onMetaChanged={refetchShipment}
          />
        }
      />
    </ShipmentWorkspacePageShell>
  );
}
