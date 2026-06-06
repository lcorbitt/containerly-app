"use client";

import { ShipmentShareMenu } from "@/components/ShipmentShareMenu";
import { useShipmentAccessTabContent } from "../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { ShipmentNotificationsSection } from "./ShipmentNotificationsSection";
import { ShipmentTagsSection } from "./ShipmentTagsSection";
import { ShipmentTeamFields } from "./ShipmentTeamFields";
import type { ShipmentAccessSidebarProps } from "./types";

export function ShipmentAccessSidebar({
  shipmentId,
  initialAssigneeUserId,
  onMetaChanged,
}: ShipmentAccessSidebarProps) {
  const accessState = useShipmentAccessTabContent({ shipmentId, initialAssigneeUserId, onMetaChanged });

  return (
    <section
      aria-label="Shipment team and settings"
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
    >
      <div className="w-full border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <ShipmentShareMenu shipmentId={shipmentId} state={accessState} variant="sidebar" />
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
