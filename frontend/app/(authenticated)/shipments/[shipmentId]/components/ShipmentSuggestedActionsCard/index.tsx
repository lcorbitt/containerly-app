"use client";

import { useMemo } from "react";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { ShipmentSuggestedActionsPanel } from "@/components/ShipmentSuggestedActionsPanel";
import { suggestShipmentActions } from "@/utils/shipment-actions";
import {
  SHIPMENT_SUGGESTED_ACTIONS_CARD_BODY_CLASS,
  SHIPMENT_SUGGESTED_ACTIONS_CARD_CLASS,
} from "./constants";
import { operatorShipmentSuggestionContext } from "./utils";

export function ShipmentSuggestedActionsCard({ row }: { row: ShipmentWorkspaceRow }) {
  const suggestionContext = useMemo(() => operatorShipmentSuggestionContext(row), [row]);
  const actions = useMemo(
    () => suggestShipmentActions({ audience: "operator", ...suggestionContext }),
    [suggestionContext],
  );

  if (actions.length === 0) return null;

  return (
    <section className={SHIPMENT_SUGGESTED_ACTIONS_CARD_CLASS} aria-label="Suggested actions">
      <div className={SHIPMENT_SUGGESTED_ACTIONS_CARD_BODY_CLASS}>
        <ShipmentSuggestedActionsPanel
          audience="operator"
          shipmentId={row.id}
          variant="standalone"
          suggestionContext={suggestionContext}
        />
      </div>
    </section>
  );
}
