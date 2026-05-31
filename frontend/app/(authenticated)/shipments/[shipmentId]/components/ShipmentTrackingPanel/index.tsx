"use client";

import { ShipmentCarrierTrackingPanel } from "../ShipmentCarrierTrackingPanel";
import { ShipmentMailTrackingPanel } from "../ShipmentMailTrackingPanel";
import { SHIPMENT_TRACKING_PANEL_STACK_CLASS } from "./constants";

export function ShipmentTrackingPanel({
  shipmentId,
  organizationId,
  workflowStatus,
  physicalMailTrackingNumber,
  onEnabled,
}: {
  shipmentId: string;
  organizationId: string;
  workflowStatus: string | null | undefined;
  physicalMailTrackingNumber?: string | null;
  onEnabled?: () => void;
}) {
  return (
    <div className={SHIPMENT_TRACKING_PANEL_STACK_CLASS}>
      <ShipmentMailTrackingPanel
        shipmentId={shipmentId}
        initialTrackingNumber={physicalMailTrackingNumber ?? undefined}
        onSaved={onEnabled}
      />
      <ShipmentCarrierTrackingPanel
        shipmentId={shipmentId}
        organizationId={organizationId}
        workflowStatus={workflowStatus}
        onEnabled={onEnabled}
      />
    </div>
  );
}
