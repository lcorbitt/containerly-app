"use client";

import { useMemo } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import { useShipmentScopeThreadQuery } from "@/hooks/queries/useShipment";
import { ShipmentCarrierTrackingPanel } from "../ShipmentCarrierTrackingPanel";
import { ShipmentMailTrackingPanel } from "../ShipmentMailTrackingPanel";
import { isShipmentPostApproval } from "@/utils/shipment-workflow-status";
import {
  SHIPMENT_TRACKING_PANEL_STACK_CLASS,
  SHIPMENT_TRACKING_TIMELINE_CLASS,
} from "./constants";
import { buildAttachmentDisplayNameMap } from "./utils";

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
  const scopeThreadQuery = useShipmentScopeThreadQuery(organizationId, shipmentId);

  const attachmentDisplayNamesById = useMemo(() => {
    const attachments = scopeThreadQuery.data?.ok ? scopeThreadQuery.data.attachments : [];
    return buildAttachmentDisplayNameMap(attachments);
  }, [scopeThreadQuery.data]);

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
        attachmentDisplayNamesById={attachmentDisplayNamesById}
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
