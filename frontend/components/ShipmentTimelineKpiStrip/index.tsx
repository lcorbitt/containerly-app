"use client";

import {
  SHIPMENT_TIMELINE_KPI_ITEM_CLASS,
  SHIPMENT_TIMELINE_KPI_LABEL_CLASS,
  SHIPMENT_TIMELINE_KPI_STRIP_CLASS,
  SHIPMENT_TIMELINE_KPI_VALUE_CLASS,
} from "./constants";
import type { ShipmentTimelineKpiStripProps } from "./types";
import { formatMetricHours } from "./utils";

function KpiItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={SHIPMENT_TIMELINE_KPI_ITEM_CLASS}>
      <p className={SHIPMENT_TIMELINE_KPI_LABEL_CLASS}>{label}</p>
      <p className={SHIPMENT_TIMELINE_KPI_VALUE_CLASS}>{value}</p>
    </div>
  );
}

export function ShipmentTimelineKpiStrip({ metrics }: ShipmentTimelineKpiStripProps) {
  if (metrics.message_count === 0 && metrics.days_in_workflow_status == null) {
    return null;
  }

  return (
    <div className={SHIPMENT_TIMELINE_KPI_STRIP_CLASS} aria-label="Shipment activity metrics">
      <KpiItem label="Messages" value={String(metrics.message_count)} />
      <KpiItem label="Back-and-forth" value={String(metrics.back_and_forth_count)} />
      <KpiItem label="Median reply" value={formatMetricHours(metrics.median_response_hours)} />
      <KpiItem
        label="Days in status"
        value={
          metrics.days_in_workflow_status != null ? String(metrics.days_in_workflow_status) : "—"
        }
      />
    </div>
  );
}
