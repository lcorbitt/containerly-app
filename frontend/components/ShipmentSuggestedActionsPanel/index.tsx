"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SuggestedShipmentActions } from "@/components/SuggestedShipmentActions";
import {
  messageTemplateForAction,
  shipmentActionTabForHandler,
  suggestShipmentActions,
} from "@/utils/shipment-actions";
import { SHIPMENT_WORKSPACE_SCROLL_TARGET_DOCUMENTS_TAB } from "@/utils/workspace-tab-panel";
import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";
import type { ShipmentSuggestedActionsPanelProps } from "./types";

export function ShipmentSuggestedActionsPanel({
  audience,
  shipmentId,
  suggestionContext,
  onAction,
  variant = "card",
}: ShipmentSuggestedActionsPanelProps) {
  const router = useRouter();

  const actions = useMemo(
    () =>
      suggestShipmentActions({
        audience,
        ...suggestionContext,
      }),
    [audience, suggestionContext],
  );

  const handleAction = useCallback(
    (action: SuggestedShipmentAction) => {
      if (onAction) {
        onAction(action);
        return;
      }

      if (!shipmentId) return;

      const tab = shipmentActionTabForHandler(
        action.handler_key as Parameters<typeof shipmentActionTabForHandler>[0],
      );
      const template = messageTemplateForAction(action.id);
      const params = new URLSearchParams();
      if (tab) params.set("tab", tab);
      if (template) params.set("draft", template);
      if (action.handler_key === "upload_draft_documents") {
        params.set("scroll", SHIPMENT_WORKSPACE_SCROLL_TARGET_DOCUMENTS_TAB);
      }
      const query = params.toString();
      router.push(query ? `/shipments/${shipmentId}?${query}` : `/shipments/${shipmentId}`, {
        scroll: false,
      });
    },
    [onAction, router, shipmentId],
  );

  return <SuggestedShipmentActions actions={actions} onAction={handleAction} variant={variant} />;
}
