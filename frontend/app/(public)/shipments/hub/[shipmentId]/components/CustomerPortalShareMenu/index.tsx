"use client";

import { ShipmentShareMenu } from "@/components/ShipmentShareMenu";
import { useShipmentAccessTabContent } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";

export function CustomerPortalShareMenu({ shipmentId }: { shipmentId: string }) {
  const state = useShipmentAccessTabContent({
    shipmentId,
    initialAssigneeUserId: null,
    onMetaChanged: () => {},
  });

  return <ShipmentShareMenu shipmentId={shipmentId} state={state} variant="portal" />;
}
