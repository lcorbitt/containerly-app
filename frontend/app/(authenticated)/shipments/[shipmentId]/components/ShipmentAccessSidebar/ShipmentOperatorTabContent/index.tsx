"use client";

import type { ShipmentAccessTabContentState } from "../../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { ShipmentNotificationsSection } from "../ShipmentNotificationsSection";
import { ShipmentTagsSection } from "../ShipmentTagsSection";
import { ShipmentTeamFields } from "../ShipmentTeamFields";

export interface ShipmentOperatorTabContentProps {
  shipmentId: string;
  state: ShipmentAccessTabContentState;
}

export function ShipmentOperatorTabContent({ shipmentId, state }: ShipmentOperatorTabContentProps) {
  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <ShipmentTeamFields state={state} />
      <ShipmentTagsSection
        shipmentId={shipmentId}
        initialTags={state.tags}
        orgTagSuggestions={state.orgTagSuggestions}
        onTagsSaved={state.applySavedTags}
      />
      <ShipmentNotificationsSection
        shipmentId={shipmentId}
        initialSubscribed={state.emailNotificationsSubscribed}
      />
    </div>
  );
}
