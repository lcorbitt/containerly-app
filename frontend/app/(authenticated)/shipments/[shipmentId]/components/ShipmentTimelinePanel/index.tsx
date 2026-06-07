"use client";

import { useMemo, useState } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import type { PublicTimelineEvent } from "@/types/public-report";
import { useShipmentScopeThreadQuery } from "@/hooks/queries/useShipment";
import { ShipmentMailTrackingPanel } from "../ShipmentMailTrackingPanel";
import { isShipmentPostApproval } from "@/utils/shipment-workflow-status";
import {
  SHIPMENT_TIMELINE_PANEL_STACK_CLASS,
  SHIPMENT_TIMELINE_SECTION_CLASS,
} from "./constants";
import { buildAttachmentDisplayNameMap } from "./utils";

export function ShipmentTimelinePanel({
  shipmentId,
  organizationId,
  workflowStatus,
  physicalMailTrackingNumber,
  activityEvents = [],
  carrierEvents = [],
  attachmentDisplayNamesById: attachmentDisplayNamesByIdProp,
  readOnly = false,
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
  const [scrollToLatestNonce, setScrollToLatestNonce] = useState(0);

  function handleTrackingSaved() {
    setScrollToLatestNonce((nonce) => nonce + 1);
    onEnabled?.();
  }

  return (
    <div className={SHIPMENT_TIMELINE_PANEL_STACK_CLASS}>
      {!readOnly ? (
        <ShipmentMailTrackingPanel
          shipmentId={shipmentId}
          organizationId={organizationId}
          initialTrackingNumber={physicalMailTrackingNumber ?? undefined}
          enabled={postApproval}
          onSaved={handleTrackingSaved}
        />
      ) : null}

      <ShipmentTimeline
        events={carrierEvents}
        activityEvents={activityEvents}
        attachmentDisplayNamesById={attachmentDisplayNamesById}
        className={SHIPMENT_TIMELINE_SECTION_CLASS}
        emptyHint="Document uploads, approvals, and carrier updates will appear here."
        scrollToLatestNonce={scrollToLatestNonce}
      />
    </div>
  );
}
