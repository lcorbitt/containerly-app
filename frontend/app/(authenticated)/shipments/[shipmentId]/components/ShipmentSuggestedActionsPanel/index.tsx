"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { SuggestedShipmentActions } from "@/components/SuggestedShipmentActions";
import {
  messageTemplateForAction,
  shipmentActionTabForHandler,
  suggestShipmentActions,
} from "@/utils/shipment-actions";
import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";

export function ShipmentSuggestedActionsPanel({
  row,
  shipmentId,
}: {
  row: ShipmentWorkspaceRow;
  shipmentId: string;
}) {
  const router = useRouter();

  const actions = useMemo(
    () =>
      suggestShipmentActions({
        triageBucketKey: row.context.triage_bucket_key,
        workflowStatus: row.workflow_status,
        lastMessageAuthorKind:
          row.metrics.message_count > 0 && row.insight_cards.some((c) => c.id === "customer_waiting")
            ? "customer"
            : null,
      }),
    [row],
  );

  const handleAction = useCallback(
    (action: SuggestedShipmentAction) => {
      const tab = shipmentActionTabForHandler(
        action.handler_key as Parameters<typeof shipmentActionTabForHandler>[0],
      );
      const template = messageTemplateForAction(action.id);
      const params = new URLSearchParams();
      if (tab) params.set("tab", tab);
      if (template) params.set("draft", template);
      router.push(`/shipments/${shipmentId}?${params.toString()}`, { scroll: false });
    },
    [router, shipmentId],
  );

  return <SuggestedShipmentActions actions={actions} onAction={handleAction} />;
}
