"use client";

import { useMemo } from "react";
import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";
import { ShipmentSuggestedActionsPanel } from "@/components/ShipmentSuggestedActionsPanel";
import type { ShipmentActionAudience, SuggestShipmentActionsInput } from "@/utils/shipment-actions";
import { suggestShipmentActions } from "@/utils/shipment-actions";
import {
  PORTAL_SUGGESTED_ACTIONS_CARD_BODY_CLASS,
  PORTAL_SUGGESTED_ACTIONS_CARD_CLASS,
} from "./constants";

export function PortalSuggestedActionsCard({
  audience,
  suggestionContext,
  onAction,
}: {
  audience: ShipmentActionAudience;
  suggestionContext: Omit<SuggestShipmentActionsInput, "audience">;
  onAction: (action: SuggestedShipmentAction) => void;
}) {
  const actions = useMemo(
    () => suggestShipmentActions({ audience, ...suggestionContext }),
    [audience, suggestionContext],
  );

  if (actions.length === 0) return null;

  return (
    <section className={PORTAL_SUGGESTED_ACTIONS_CARD_CLASS} aria-label="Suggested actions">
      <div className={PORTAL_SUGGESTED_ACTIONS_CARD_BODY_CLASS}>
        <ShipmentSuggestedActionsPanel
          audience={audience}
          variant="standalone"
          suggestionContext={suggestionContext}
          onAction={onAction}
        />
      </div>
    </section>
  );
}
