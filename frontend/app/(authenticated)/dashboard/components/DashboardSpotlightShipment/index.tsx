"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShipmentCommercialRouteLane } from "@/components/ShipmentCommercialHeader/ShipmentCommercialRouteLane";
import { TRIAGE_BUCKET_LABELS } from "@/utils/dashboard-metrics";
import {
  DASHBOARD_SPOTLIGHT_DETAIL_CLASS,
  DASHBOARD_SPOTLIGHT_EYEBROW_CLASS,
  DASHBOARD_SPOTLIGHT_LINK_CLASS,
  DASHBOARD_SPOTLIGHT_PANEL_CLASS,
  DASHBOARD_SPOTLIGHT_TITLE_CLASS,
} from "./constants";
import type { DashboardSpotlightShipmentProps } from "./types";

export function DashboardSpotlightShipment({ spotlight }: DashboardSpotlightShipmentProps) {
  if (!spotlight) {
    return (
      <section className={DASHBOARD_SPOTLIGHT_PANEL_CLASS}>
        <p className={DASHBOARD_SPOTLIGHT_EYEBROW_CLASS}>Spotlight</p>
        <h2 className={DASHBOARD_SPOTLIGHT_TITLE_CLASS}>All clear</h2>
        <p className={DASHBOARD_SPOTLIGHT_DETAIL_CLASS}>
          No urgent items in your triage queue. Browse shipments or check carrier sync status in the charts.
        </p>
        <Link href="/shipments" className={DASHBOARD_SPOTLIGHT_LINK_CLASS}>
          View all shipments
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    );
  }

  const orderLabel = spotlight.orderNumber?.trim() || "Shipment";
  const bucketLabel = TRIAGE_BUCKET_LABELS[spotlight.bucketKey];

  return (
    <section className={DASHBOARD_SPOTLIGHT_PANEL_CLASS}>
      <p className={DASHBOARD_SPOTLIGHT_EYEBROW_CLASS}>Needs attention · {bucketLabel}</p>
      <h2 className={DASHBOARD_SPOTLIGHT_TITLE_CLASS}>{orderLabel}</h2>
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{spotlight.containerNumber}</p>
      <p className={DASHBOARD_SPOTLIGHT_DETAIL_CLASS}>{spotlight.triageDetail}</p>

      <div className="mt-4">
        <ShipmentCommercialRouteLane
          origin={spotlight.portOfLoading}
          destination={spotlight.portOfDestination}
        />
      </div>

      <div className="mt-auto flex flex-wrap gap-4 pt-4">
        <Link href={`/containers/${spotlight.containerId}`} className={DASHBOARD_SPOTLIGHT_LINK_CLASS}>
          Open container
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link href={`/shipments/${spotlight.shipmentId}`} className={DASHBOARD_SPOTLIGHT_LINK_CLASS}>
          Shipment workspace
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
