"use client";

import { memo } from "react";
import { ShipmentNotificationsPanel } from "./ShipmentNotificationsPanel";
import { useShipmentNotificationsPanel } from "./ShipmentNotificationsPanel/useShipmentNotificationsPanel";

export const ShipmentNotificationsSection = memo(function ShipmentNotificationsSection({
  shipmentId,
  initialSubscribed,
}: {
  shipmentId: string;
  initialSubscribed: boolean;
}) {
  const notificationsState = useShipmentNotificationsPanel({
    shipmentId,
    initialSubscribed,
  });

  return (
    <section className="py-3 last:pb-0">
      <ShipmentNotificationsPanel state={notificationsState} />
    </section>
  );
});
