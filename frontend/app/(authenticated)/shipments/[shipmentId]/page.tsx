"use client";

import { Suspense, use } from "react";
import { ShipmentWorkspace } from "./components/ShipmentWorkspace";

export default function AuthenticatedShipmentPortalPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = use(params);
  // ShipmentWorkspace owns the loading UI (and the navigation content gate), so this boundary only
  // covers param resolution — keep it blank to avoid flashing a second "Loading Shipment…" loader.
  return (
    <Suspense fallback={null}>
      <ShipmentWorkspace shipmentId={shipmentId} />
    </Suspense>
  );
}
