"use client";

import { Suspense, use } from "react";
import { PageLoading } from "@/components/PageLoading";
import { ShipmentWorkspace } from "./components/ShipmentWorkspace";

export default function AuthenticatedShipmentPortalPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = use(params);
  return (
    <Suspense fallback={<PageLoading loadingText="Loading Shipment…" />}>
      <ShipmentWorkspace shipmentId={shipmentId} />
    </Suspense>
  );
}
