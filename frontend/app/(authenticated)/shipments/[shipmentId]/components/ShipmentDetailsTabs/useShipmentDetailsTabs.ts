"use client";

import { useMemo } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { useShipmentScopeThreadQuery } from "@/hooks/queries/useShipment";
import {
  countShipmentScopeDocuments,
  countShipmentScopeMessages,
  countShipmentScopeTrackingEvents,
} from "@/utils/workspace-tab-counts";

export function useShipmentDetailsTabs({
  shipmentId,
  organizationId,
  activityEvents,
}: {
  shipmentId: string;
  organizationId: string;
  activityEvents: ShipmentActivityEvent[];
}) {
  const threadQuery = useShipmentScopeThreadQuery(organizationId, shipmentId);

  const trackingCount = useMemo(
    () => countShipmentScopeTrackingEvents({ activityEvents }),
    [activityEvents],
  );

  const documentsCount = useMemo(() => {
    const attachments = threadQuery.data?.ok ? threadQuery.data.attachments : [];
    return countShipmentScopeDocuments(attachments);
  }, [threadQuery.data]);

  const messagesCount = useMemo(() => {
    const messages = threadQuery.data?.ok ? threadQuery.data.messages : [];
    return countShipmentScopeMessages(messages);
  }, [threadQuery.data]);

  return { trackingCount, documentsCount, messagesCount };
}
