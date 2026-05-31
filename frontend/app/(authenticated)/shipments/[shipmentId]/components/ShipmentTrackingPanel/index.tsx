"use client";

import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import { ShipmentCarrierTrackingPanel } from "../ShipmentCarrierTrackingPanel";
import { ShipmentMailTrackingPanel } from "../ShipmentMailTrackingPanel";
import { isShipmentPostApproval } from "@/utils/shipment-workflow-status";
import {
  SHIPMENT_TRACKING_PANEL_STACK_CLASS,
  SHIPMENT_TRACKING_TIMELINE_CLASS,
} from "./constants";

export function ShipmentTrackingPanel({
  shipmentId,
  organizationId,
  workflowStatus,
  physicalMailTrackingNumber,
  activityEvents = [],
  onEnabled,
}: {
  shipmentId: string;
  organizationId: string;
  workflowStatus: string | null | undefined;
  physicalMailTrackingNumber?: string | null;
  activityEvents?: ShipmentActivityEvent[];
  onEnabled?: () => void;
}) {
  const postApproval = isShipmentPostApproval(workflowStatus);

  return (
    <div className={SHIPMENT_TRACKING_PANEL_STACK_CLASS}>
      <ShipmentCarrierTrackingPanel
        shipmentId={shipmentId}
        organizationId={organizationId}
        workflowStatus={workflowStatus}
        onEnabled={onEnabled}
      />

      <ShipmentTimeline
        activityEvents={activityEvents}
        hideHeader={false}
        className={SHIPMENT_TRACKING_TIMELINE_CLASS}
        emptyHint="Document uploads, approvals, and carrier updates will appear here."
      />

      {postApproval ? (
        <ShipmentMailTrackingPanel
          shipmentId={shipmentId}
          initialTrackingNumber={physicalMailTrackingNumber ?? undefined}
          onSaved={onEnabled}
        />
      ) : null}
    </div>
  );
}
