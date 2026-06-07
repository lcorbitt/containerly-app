"use client";

import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import { ShipmentCommercialDetailsGrid } from "./ShipmentCommercialDetailsGrid";
import { ShipmentCommercialSummaryBar } from "./ShipmentCommercialSummaryBar";
import {
  SHIPMENT_COMMERCIAL_HEADER_STATUS_ROW_CLASS,
  SHIPMENT_COMMERCIAL_HEADER_STATUS_ROW_LABEL_CLASS,
  SHIPMENT_DOCUMENTS_STATUS_LABEL,
} from "./constants";
import type { ShipmentCommercialHeaderProps } from "./types";

export function ShipmentCommercialHeader({ source, workflowStatus }: ShipmentCommercialHeaderProps) {
  return (
    <>
      <ShipmentCommercialSummaryBar source={source} />
      {workflowStatus?.trim() ? (
        <div className={SHIPMENT_COMMERCIAL_HEADER_STATUS_ROW_CLASS}>
          <span className={SHIPMENT_COMMERCIAL_HEADER_STATUS_ROW_LABEL_CLASS}>
            {SHIPMENT_DOCUMENTS_STATUS_LABEL}
          </span>
          <ShipmentWorkflowStatusPill status={workflowStatus} compact />
        </div>
      ) : null}
      <ShipmentCommercialDetailsGrid source={source} />
    </>
  );
}

export type { ShipmentCommercialHeaderProps, ShipmentCommercialHeaderSource } from "./types";
