"use client";

import { useMemo } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { PublicTimelineEvent } from "@/types/public-report";
import { useShipmentScopeThreadQuery } from "@/hooks/queries/useShipment";
import {
  countShipmentScopeDocuments,
  countShipmentScopeMessages,
  countShipmentScopeTimelineEvents,
} from "@/utils/workspace-tab-counts";

export function useShipmentDetailsTabs({
  shipmentId,
  organizationId,
  activityEvents,
  carrierEvents = [],
}: {
  shipmentId: string;
  organizationId: string;
  activityEvents: ShipmentActivityEvent[];
  carrierEvents?: PublicTimelineEvent[];
}) {
  const threadQuery = useShipmentScopeThreadQuery(organizationId, shipmentId);

  const timelineCount = useMemo(
    () => countShipmentScopeTimelineEvents({ activityEvents, carrierEvents }),
    [activityEvents, carrierEvents],
  );

  const documentsCount = useMemo(() => {
    const attachments = threadQuery.data?.ok ? threadQuery.data.attachments : [];
    return countShipmentScopeDocuments(attachments);
  }, [threadQuery.data]);

  const messagesCount = useMemo(() => {
    const messages = threadQuery.data?.ok ? threadQuery.data.messages : [];
    return countShipmentScopeMessages(messages);
  }, [threadQuery.data]);

  return { timelineCount, documentsCount, messagesCount };
}
