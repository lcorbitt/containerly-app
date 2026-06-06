"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TRIAGE_BUCKET_LABELS, formatTriageRouteLine } from "@/utils/dashboard-metrics";
import {
  DASHBOARD_SPOTLIGHT_ACTIONS_CLASS,
  DASHBOARD_SPOTLIGHT_CONTAINER_CLASS,
  DASHBOARD_SPOTLIGHT_DETAIL_CLAMP_CLASS,
  DASHBOARD_SPOTLIGHT_EYEBROW_CLASS,
  DASHBOARD_SPOTLIGHT_LINK_CLASS,
  DASHBOARD_SPOTLIGHT_META_CLASS,
  DASHBOARD_SPOTLIGHT_PANEL_BODY_CLASS,
  DASHBOARD_SPOTLIGHT_PANEL_CLASS,
  DASHBOARD_SPOTLIGHT_PANEL_URGENT_CLASS,
  DASHBOARD_SPOTLIGHT_ROUTE_CLASS,
  DASHBOARD_SPOTLIGHT_TITLE_CLASS,
} from "./constants";
import type { DashboardSpotlightShipmentProps } from "./types";

function buildSpotlightMeta(context: DashboardSpotlightShipmentProps["context"]): string | null {
  if (!context) return null;
  const parts: string[] = [];
  const customer = context.customerName?.trim();
  if (customer) parts.push(customer);
  const carrier = context.carrierStatus?.trim();
  if (carrier) parts.push(carrier);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function DashboardSpotlightShipment({ spotlight, context }: DashboardSpotlightShipmentProps) {
  if (!spotlight) {
    return (
      <section className={DASHBOARD_SPOTLIGHT_PANEL_CLASS}>
        <div className={`${DASHBOARD_SPOTLIGHT_PANEL_BODY_CLASS} flex h-full flex-col`}>
          <p className={DASHBOARD_SPOTLIGHT_EYEBROW_CLASS}>Spotlight</p>
          <h2 className={DASHBOARD_SPOTLIGHT_TITLE_CLASS}>All clear</h2>
          <p className={DASHBOARD_SPOTLIGHT_DETAIL_CLAMP_CLASS}>
            No urgent items in your triage queue.
          </p>
          <Link href="/shipments" className={`${DASHBOARD_SPOTLIGHT_LINK_CLASS} mt-auto pt-3`}>
            ViewShipments
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const orderLabel = spotlight.orderNumber?.trim() || "Shipment";
  const bucketLabel = TRIAGE_BUCKET_LABELS[spotlight.bucketKey];
  const routeLine = formatTriageRouteLine(spotlight.portOfLoading, spotlight.portOfDestination);
  const metaLine = buildSpotlightMeta(context);

  return (
    <section className={DASHBOARD_SPOTLIGHT_PANEL_CLASS}>
      <div
        className={`${DASHBOARD_SPOTLIGHT_PANEL_BODY_CLASS} ${DASHBOARD_SPOTLIGHT_PANEL_URGENT_CLASS} flex h-full flex-col`}
      >
        <p className={DASHBOARD_SPOTLIGHT_EYEBROW_CLASS}>
          Needs attention · {bucketLabel}
        </p>
        <h2 className={DASHBOARD_SPOTLIGHT_TITLE_CLASS}>{orderLabel}</h2>
        <p className={DASHBOARD_SPOTLIGHT_CONTAINER_CLASS}>{spotlight.containerNumber}</p>
        {metaLine ? <p className={DASHBOARD_SPOTLIGHT_META_CLASS}>{metaLine}</p> : null}
        {routeLine ? <p className={DASHBOARD_SPOTLIGHT_ROUTE_CLASS}>{routeLine}</p> : null}
        <p className={DASHBOARD_SPOTLIGHT_DETAIL_CLAMP_CLASS}>{spotlight.triageDetail}</p>

        <div className={DASHBOARD_SPOTLIGHT_ACTIONS_CLASS}>
          <Link href={`/containers/${spotlight.containerId}`} className={DASHBOARD_SPOTLIGHT_LINK_CLASS}>
            Open container
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link href={`/shipments/${spotlight.shipmentId}`} className={DASHBOARD_SPOTLIGHT_LINK_CLASS}>
            Shipment workspace
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
