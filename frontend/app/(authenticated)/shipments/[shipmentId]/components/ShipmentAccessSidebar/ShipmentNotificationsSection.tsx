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
    <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <ShipmentNotificationsPanel state={notificationsState} />
    </section>
  );
});
