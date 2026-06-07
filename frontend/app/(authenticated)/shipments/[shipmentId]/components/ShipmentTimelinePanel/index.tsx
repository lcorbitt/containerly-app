"use client";

import { useMemo } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import type { PublicTimelineEvent } from "@/types/public-report";
import { useShipmentScopeThreadQuery } from "@/hooks/queries/useShipment";
import {
  SHIPMENT_TIMELINE_PANEL_STACK_CLASS,
  SHIPMENT_TIMELINE_SECTION_CLASS,
} from "./constants";
import { buildAttachmentDisplayNameMap } from "./utils";

export function ShipmentTimelinePanel({
  shipmentId,
  organizationId,
  activityEvents = [],
  carrierEvents = [],
  attachmentDisplayNamesById: attachmentDisplayNamesByIdProp,
}: {
  shipmentId: string;
  organizationId: string;
  activityEvents?: ShipmentActivityEvent[];
  /** Carrier milestone events (portal payload timeline). */
  carrierEvents?: PublicTimelineEvent[];
  /** When set, skips workspace scope query (customer portal). */
  attachmentDisplayNamesById?: Record<string, string>;
}) {
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
    <div className={SHIPMENT_TIMELINE_PANEL_STACK_CLASS}>
      <ShipmentTimeline
        events={carrierEvents}
        activityEvents={activityEvents}
        attachmentDisplayNamesById={attachmentDisplayNamesById}
        className={SHIPMENT_TIMELINE_SECTION_CLASS}
        emptyHint="Document uploads, approvals, and carrier updates will appear here."
      />
    </div>
  );
}
