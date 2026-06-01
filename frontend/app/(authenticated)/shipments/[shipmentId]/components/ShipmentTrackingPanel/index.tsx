"use client";

import { useMemo } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import type { PublicTimelineEvent } from "@/types/public-report";
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
  carrierEvents = [],
  attachmentDisplayNamesById: attachmentDisplayNamesByIdProp,
  readOnly = false,
  timelineIsActive = true,
  onEnabled,
}: {
  shipmentId: string;
  organizationId: string;
  workflowStatus: string | null | undefined;
  physicalMailTrackingNumber?: string | null;
  activityEvents?: ShipmentActivityEvent[];
  /** Carrier milestone events (portal payload timeline). */
  carrierEvents?: PublicTimelineEvent[];
  /** When set, skips workspace scope query (customer portal). */
  attachmentDisplayNamesById?: Record<string, string>;
  readOnly?: boolean;
  /** Parent tracking tab visible — defers auto-scroll until the panel is shown. */
  timelineIsActive?: boolean;
  onEnabled?: () => void;
}) {
  const postApproval = isShipmentPostApproval(workflowStatus);
  const scopeThreadQuery = useShipmentScopeThreadQuery(
    attachmentDisplayNamesByIdProp ? null : organizationId || null,
    shipmentId,
  );

  const attachmentDisplayNamesByIdFromQuery = useMemo(() => {
    const attachments = scopeThreadQuery.data?.ok ? scopeThreadQuery.data.attachments : [];
    return buildAttachmentDisplayNameMap(attachments);
  }, [scopeThreadQuery.data]);

  const attachmentDisplayNamesById = attachmentDisplayNamesByIdProp ?? attachmentDisplayNamesByIdFromQuery;

  return (
    <div className={SHIPMENT_TRACKING_PANEL_STACK_CLASS}>
      <ShipmentCarrierTrackingPanel
        shipmentId={shipmentId}
        organizationId={organizationId}
        workflowStatus={workflowStatus}
        readOnly={readOnly}
        onEnabled={onEnabled}
      />

      <ShipmentTimeline
        events={carrierEvents}
        activityEvents={activityEvents}
        attachmentDisplayNamesById={attachmentDisplayNamesById}
        isActive={timelineIsActive}
        className={SHIPMENT_TRACKING_TIMELINE_CLASS}
        emptyHint="Document uploads, approvals, and carrier updates will appear here."
      />

      {postApproval ? (
        <ShipmentMailTrackingPanel
          shipmentId={shipmentId}
          initialTrackingNumber={physicalMailTrackingNumber ?? undefined}
          readOnly={readOnly}
          onSaved={onEnabled}
        />
      ) : null}
    </div>
  );
}
