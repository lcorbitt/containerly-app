"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLoading } from "@/components/PageLoading";
import { ShipmentAccessSidebar } from "../ShipmentAccessSidebar";
import { ShipmentDetailsTabs } from "../ShipmentDetailsTabs";
import type { ShipmentDetailsTabId } from "../ShipmentDetailsTabs/types";
import { parseShipmentDetailsTabParam } from "../ShipmentDetailsTabs/utils";
import { ShipmentDetailsTabsSection } from "../ShipmentDetailsTabsSection";
import { ContainerWorkspace } from "@/app/(authenticated)/containers/[containerId]/components/ContainerWorkspace";
import { ShipmentDetailsCard } from "../ShipmentHeaderInfo/ShipmentDetailsCard";
import { ShipmentCommercialDetailsSection } from "../ShipmentHeaderInfo/ShipmentCommercialDetailsSection";
import { EditShipmentDetailsModal } from "../ShipmentHeaderInfo/EditShipmentDetailsModal";
import {
  pickTrackingRowsExported,
  deleteCommercialShipment,
  type ShipmentWorkspaceRow,
  type ShipmentOverviewTrackingRow,
} from "@/services/shipment.service";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useConfirm } from "@/contexts/confirm-dialog";
import { useToast } from "@/contexts/toast";
import { canManageOrganizationSettings } from "@/utils/org-role";
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        {detailsCard}
        {workspaceContent}
      </div>
      <aside className="min-w-0">{sidebar}</aside>
    </div>
  );
}

function ShipmentWorkspacePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full shrink-0 p-6">{children}</div>
  );
}

export function ShipmentWorkspace({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const { selectedOrgId, orgs, isSuperAdmin } = useOrganizationWorkspace();
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("shipment");
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [redirectAfterDelete, setRedirectAfterDelete] = useState(false);

  const selectedMembershipRole = orgs.find((o) => o.organizations?.id === selectedOrgId)?.role;
  const canDeleteShipment = canManageOrganizationSettings(isSuperAdmin, selectedMembershipRole);

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

  const activeDetailsTab = useMemo(
    () => parseShipmentDetailsTabParam(searchParams.get("tab")),
    [searchParams],
  );

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const selectDetailsTab = useCallback(
    (tab: ShipmentDetailsTabId) => {
      replaceSearchParams((params) => {
        if (tab === "tracking") {
          params.delete("tab");
        } else {
          params.set("tab", tab);
        }
      });
    },
    [replaceSearchParams],
  );

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
      replaceSearchParams((params) => {
        params.set("container", first);
      });
    }
  }, [workspaceMode, row, lines, searchParams, replaceSearchParams]);

  const selectLine = useCallback(
    (containerId: string) => {
      replaceSearchParams((params) => {
        params.set("container", containerId);
      });
    },
    [replaceSearchParams],
  );

  const handleDeleteShipment = useCallback(async () => {
    if (!selectedOrgId || !canDeleteShipment) return;
    const label = row?.order_number?.trim() || row?.customer_name?.trim() || "this shipment";
    const ok = await confirm({
      title: "Delete shipment?",
      description: `Permanently delete ${label}? This removes documents, messages, and tracking linked to the shipment.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const result = await deleteCommercialShipment({
        organization_id: selectedOrgId,
        shipment_id: shipmentId,
      });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setRedirectAfterDelete(true);
      void qc.removeQueries({
        queryKey: [...shipmentWorkspaceRowQueryKeyRoot, shipmentId],
      });
      toast("Shipment deleted", "success");
      await router.replace("/shipments");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete shipment", "error");
    } finally {
      setDeleting(false);
    }
  }, [canDeleteShipment, confirm, qc, row, router, selectedOrgId, shipmentId, toast]);

  if (!selectedOrgId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Select an organization to view this shipment.</p>
      </div>
    );
  }

  if (loading) {
    return <PageLoading loadingText="Loading Shipment…" />;
  }

  if (redirectAfterDelete) {
    return <PageLoading loadingText="Returning to shipments…" />;
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

  const shipmentMainColumn = (
    <div className="flex min-w-0 flex-col gap-6">
      <ShipmentDetailsCard
        createdAt={row.created_at}
        creatorName={row.creator_display_name}
        onEdit={() => setEditOpen(true)}
        onDelete={canDeleteShipment ? handleDeleteShipment : undefined}
        deleting={deleting}
      >
        <ShipmentCommercialDetailsSection
          row={row}
          workflowStatus={row.workflow_status ?? undefined}
          editModal={editModal}
          onRiskSaved={refetchShipment}
        />
      </ShipmentDetailsCard>

      <ShipmentDetailsTabsSection>
        <ShipmentDetailsTabs
          shipmentId={shipmentId}
          organizationId={selectedOrgId!}
          workflowStatus={row.workflow_status ?? undefined}
          physicalMailTrackingNumber={row.physical_mail_tracking_number}
          activityEvents={row.activity_events ?? []}
          activeTab={activeDetailsTab}
          onTabChange={selectDetailsTab}
          onTrackingEnabled={refetchShipment}
          detailsContent={
            workspaceMode === "container" && lines.length > 1 ? (
              <nav aria-label="Carrier lines">
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
            ) : null
          }
        />
      </ShipmentDetailsTabsSection>
    </div>
  );

  if (lines.length === 0) {
    return (
      <ShipmentWorkspacePageShell>
        <ShipmentWorkspaceLayout
          detailsCard={shipmentMainColumn}
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
        detailsCard={shipmentMainColumn}
        workspaceContent={
          workspaceMode === "container" ? (
            activeContainerId ? (
              <ContainerWorkspace
                key={activeContainerId}
                containerId={activeContainerId}
                shipmentEmbed={{ onSelectContainer: selectLine }}
              />
            ) : (
              <p className="py-8 text-sm text-zinc-600 dark:text-zinc-400">Pick a container line above.</p>
            )
          ) : undefined
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
