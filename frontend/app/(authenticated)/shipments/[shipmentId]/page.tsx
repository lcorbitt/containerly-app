"use client";

import { Suspense, use } from "react";
import { PageLoading } from "@/components/page-loading";
import { ShipmentWorkspace } from "@/components/shipment-workspace";

export default function AuthenticatedShipmentPortalPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="mx-auto box-border flex min-h-0 w-full max-w-6xl flex-1 flex-col p-6">
          <PageLoading loadingText="Loading shipment…" />
        </div>
      }
    >
      <ShipmentWorkspace shipmentId={shipmentId} />
    </Suspense>
  );
}
