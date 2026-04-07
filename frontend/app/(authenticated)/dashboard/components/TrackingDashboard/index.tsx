"use client";

import Link from "next/link";
import { startTransition, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardPersonalOverview } from "../DashboardPersonalOverview";
import { DashboardTriage } from "../DashboardTriage";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { TRACKING_CREATED_EVENT } from "@/utils/tracking-created-event";
import {
  trackingDashboardQueryKeyRoot,
  useTrackingDashboardQuery,
} from "@/hooks/queries/useTracking";

export function TrackingDashboard() {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const qc = useQueryClient();
  const q = useTrackingDashboardQuery(selectedOrgId);

  useEffect(() => {
    const onCreated = () => {
      startTransition(() => {
        void qc.invalidateQueries({ queryKey: trackingDashboardQueryKeyRoot });
      });
    };
    window.addEventListener(TRACKING_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(TRACKING_CREATED_EVENT, onCreated);
  }, [qc]);

  const selectedOrgName = orgs.find((r) => r.organizations?.id === selectedOrgId)?.organizations?.name ?? null;

  const snap = q.data;
  const currentUserId = snap?.currentUserId ?? null;
  const requests = snap?.requests ?? [];
  const alerts = snap?.alerts ?? [];
  const triageContainersById = snap?.triageContainersById ?? {};
  const triageAttachmentCounts = snap?.triageAttachmentCounts ?? {};
  const triageMessages = snap?.triageMessages ?? [];
  const participatingShipmentIds = snap?.participatingShipmentIds ?? [];
  const shipmentOwnerByShipmentId = snap?.shipmentOwnerByShipmentId ?? {};
  const shipmentAssigneeByShipmentId = snap?.shipmentAssigneeByShipmentId ?? {};
  const triageLoading = q.isLoading && Boolean(selectedOrgId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Your workload and triage for shipments you own, lines assigned to you, or lines you collaborate on. Start
          tracking from{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Track</span> in the header; browse every
          shipment under <Link href="/shipments" className="font-medium text-zinc-800 underline dark:text-zinc-200">Shipments</Link>.
          {process.env.NODE_ENV === "development" ? (
            <>
              {" "}
              In local dev, <span className="font-medium text-zinc-800 dark:text-zinc-200">Simulate</span> drives mock
              milestones from the header.
            </>
          ) : null}
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
            <>
              <DashboardPersonalOverview
                userId={currentUserId}
                orgName={selectedOrgName}
                requests={requests}
                alerts={alerts}
                containersById={triageContainersById}
                shipmentOwnerByShipmentId={shipmentOwnerByShipmentId}
                shipmentAssigneeByShipmentId={shipmentAssigneeByShipmentId}
                participatingShipmentIds={participatingShipmentIds}
              />
              <DashboardTriage
                userId={currentUserId}
                loading={triageLoading}
                requests={requests}
                alerts={alerts}
                containersById={triageContainersById}
                shipmentOwnerByShipmentId={shipmentOwnerByShipmentId}
                shipmentAssigneeByShipmentId={shipmentAssigneeByShipmentId}
                attachmentCountByRequestId={triageAttachmentCounts}
                messages={triageMessages}
                participatingShipmentIds={new Set(participatingShipmentIds)}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
