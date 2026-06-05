"use client";

import { useMemo } from "react";
import { ShipmentTimelinePanel } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentTimelinePanel";
import type { PublicReportPayload } from "@/types/public-report";
import { buildPortalAttachmentDisplayNameMap } from "./utils";

export function PortalTimelinePanel({
  shipmentId,
  payload,
  onRefresh,
}: {
  shipmentId: string;
  payload: PublicReportPayload;
  onRefresh: () => void | Promise<void>;
}) {
  const organizationId = payload.organization?.id ?? "";
  const readOnly = payload.viewer === "importer";
  const attachmentDisplayNamesById = useMemo(
    () => buildPortalAttachmentDisplayNameMap(payload.attachments ?? []),
    [payload.attachments],
  );

  return (
    <ShipmentTimelinePanel
      shipmentId={shipmentId}
      organizationId={organizationId}
      workflowStatus={payload.commercial_details?.workflow_status}
      physicalMailTrackingNumber={payload.commercial_details?.physical_mail_tracking_number}
      activityEvents={payload.activity_events ?? []}
      carrierEvents={payload.timeline}
      attachmentDisplayNamesById={attachmentDisplayNamesById}
      readOnly={readOnly}
      onEnabled={() => void onRefresh()}
    />
  );
}
