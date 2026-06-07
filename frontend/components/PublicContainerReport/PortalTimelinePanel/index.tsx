"use client";

import { useMemo } from "react";
import { ShipmentTimelinePanel } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentTimelinePanel";
import type { PublicReportPayload } from "@/types/public-report";
import { buildPortalAttachmentDisplayNameMap } from "./utils";

export function PortalTimelinePanel({
  shipmentId,
  payload,
}: {
  shipmentId: string;
  payload: PublicReportPayload;
}) {
  const organizationId = payload.organization?.id ?? "";
  const attachmentDisplayNamesById = useMemo(
    () => buildPortalAttachmentDisplayNameMap(payload.attachments ?? []),
    [payload.attachments],
  );

  return (
    <ShipmentTimelinePanel
      shipmentId={shipmentId}
      organizationId={organizationId}
      activityEvents={payload.activity_events ?? []}
      carrierEvents={payload.timeline}
      attachmentDisplayNamesById={attachmentDisplayNamesById}
    />
  );
}
