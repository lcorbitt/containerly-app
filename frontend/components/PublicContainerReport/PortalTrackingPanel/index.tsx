"use client";

import { useMemo } from "react";
import { ShipmentTrackingPanel } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentTrackingPanel";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import type { PublicReportPayload } from "@/types/public-report";
import { buildPortalAttachmentDisplayNameMap } from "./utils";

export function PortalTrackingPanel({
  shipmentId,
  payload,
  isActive = true,
  onRefresh,
}: {
  shipmentId: string;
  payload: PublicReportPayload;
  isActive?: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  const { selectedOrgId } = useOrganizationWorkspace();
  const readOnly = payload.viewer === "importer";
  const attachmentDisplayNamesById = useMemo(
    () => buildPortalAttachmentDisplayNameMap(payload.attachments ?? []),
    [payload.attachments],
  );

  return (
    <ShipmentTrackingPanel
      shipmentId={shipmentId}
      organizationId={selectedOrgId ?? ""}
      workflowStatus={payload.commercial_details?.workflow_status}
      physicalMailTrackingNumber={payload.commercial_details?.physical_mail_tracking_number}
      activityEvents={payload.activity_events ?? []}
      carrierEvents={payload.timeline}
      attachmentDisplayNamesById={attachmentDisplayNamesById}
      readOnly={readOnly}
      timelineIsActive={isActive}
      onEnabled={() => void onRefresh()}
    />
  );
}
