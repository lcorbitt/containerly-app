"use client";

import { useShipmentAccessTabContent } from "../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { ShipmentCustomerPortalLink } from "./ShipmentCustomerPortalLink";
import { ShipmentNotificationsSection } from "./ShipmentNotificationsSection";
import { ShipmentTagsSection } from "./ShipmentTagsSection";
import { ShipmentTeamFields } from "./ShipmentTeamFields";

export function ShipmentAccessSidebar({
  shipmentId,
  initialAssigneeUserId,
  onMetaChanged,
}: {
  shipmentId: string;
  initialAssigneeUserId: string | null;
  onMetaChanged: () => void;
}) {
  const accessState = useShipmentAccessTabContent({ shipmentId, initialAssigneeUserId, onMetaChanged });

  return (
    <section
      aria-label="Shipment team and settings"
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
    >
      <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <ShipmentCustomerPortalLink shipmentId={shipmentId} className="w-full" />
      </div>
      {accessState.loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          <ShipmentTeamFields state={accessState} />
          <ShipmentTagsSection
            shipmentId={shipmentId}
            initialTags={accessState.tags}
            orgTagSuggestions={accessState.orgTagSuggestions}
            onTagsSaved={accessState.applySavedTags}
          />
          <ShipmentNotificationsSection
            shipmentId={shipmentId}
            initialSubscribed={accessState.emailNotificationsSubscribed}
          />
        </div>
      )}
    </section>
  );
}
