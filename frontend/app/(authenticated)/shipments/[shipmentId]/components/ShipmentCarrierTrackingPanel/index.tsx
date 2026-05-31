"use client";

import { useState } from "react";
import { isShipmentPostApproval } from "@/utils/shipment-workflow-status";
import { BolImportDialog } from "@/components/BolImportDialog";
import { NewTrackingForm } from "@/components/NewTrackingForm";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { emitTrackingCreated } from "@/utils/tracking-created-event";
import {
  SHIPMENT_CARRIER_TRACKING_INPUT_CLASS,
  SHIPMENT_CARRIER_TRACKING_PANEL_CLASS,
} from "./constants";

export function ShipmentCarrierTrackingPanel({
  shipmentId,
  organizationId,
  workflowStatus,
  onEnabled,
}: {
  shipmentId: string;
  organizationId: string;
  workflowStatus: string | null | undefined;
  onEnabled?: () => void;
}) {
  const { selectedOrgId } = useOrganizationWorkspace();
  const [expanded, setExpanded] = useState(false);
  const [bolOpen, setBolOpen] = useState(false);

  const canEnable = isShipmentPostApproval(workflowStatus);

  function handleEnabled() {
    emitTrackingCreated();
    onEnabled?.();
    setExpanded(false);
  }

  if (!canEnable) {
    return (
      <div className={SHIPMENT_CARRIER_TRACKING_PANEL_CLASS}>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Tracking number
          <input
            type="text"
            disabled
            value=""
            placeholder="Available after document approval..."
            className={SHIPMENT_CARRIER_TRACKING_INPUT_CLASS}
          />
        </label>
      </div>
    );
  }

  return (
    <>
      <div className={SHIPMENT_CARRIER_TRACKING_PANEL_CLASS}>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Carrier tracking (premium)</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Optional live milestones from a carrier API once container numbers are published.
        </p>
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Enable carrier sync
          </button>
        ) : (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <NewTrackingForm
              organizationId={organizationId}
              fixedShipmentId={shipmentId}
              onCreated={handleEnabled}
              onOpenBolImport={() => setBolOpen(true)}
              showChrome={false}
              premiumMode
            />
          </div>
        )}
      </div>
      {selectedOrgId ? (
        <BolImportDialog
          open={bolOpen}
          onClose={() => setBolOpen(false)}
          organizationId={selectedOrgId}
          onImported={handleEnabled}
          stackZIndex="z-[110]"
        />
      ) : null}
    </>
  );
}
