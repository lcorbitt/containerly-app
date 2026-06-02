"use client";

import { ShipmentWorkflowStatusPill, CarrierReportedStatusPill } from "@/components/StatusPills";
import { TrackingWorkflowStatusPill } from "@/components/StatusPills";
import {
  SHIPMENT_STATUS_STRIP_CHIP_CLASS,
  SHIPMENT_STATUS_STRIP_CLASS,
  SHIPMENT_STATUS_STRIP_LABEL_CLASS,
  SHIPMENT_STATUS_STRIP_TAG_CLASS,
} from "./constants";
import type { ShipmentStatusStripProps } from "./types";

export function ShipmentStatusStrip({
  workflowStatus,
  primaryCarrierStatus,
  trackingSyncStatus,
  context,
}: ShipmentStatusStripProps) {
  const visibleTags = context.tags.slice(0, 4);

  return (
    <div className={SHIPMENT_STATUS_STRIP_CLASS} aria-label="Shipment status">
      {workflowStatus?.trim() ? (
        <ShipmentWorkflowStatusPill status={workflowStatus} compact />
      ) : null}
      {primaryCarrierStatus?.trim() ? (
        <CarrierReportedStatusPill status={primaryCarrierStatus} />
      ) : null}
      {trackingSyncStatus?.trim() ? (
        <TrackingWorkflowStatusPill status={trackingSyncStatus} />
      ) : null}
      {visibleTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={SHIPMENT_STATUS_STRIP_LABEL_CLASS}>Issues</span>
          {visibleTags.map((tag) => (
            <span key={tag} className={`${SHIPMENT_STATUS_STRIP_CHIP_CLASS} ${SHIPMENT_STATUS_STRIP_TAG_CLASS}`}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
