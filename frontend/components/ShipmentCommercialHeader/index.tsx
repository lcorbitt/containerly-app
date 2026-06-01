"use client";

import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import type { ShipmentCommercialHeaderProps } from "./types";
import {
  SHIPMENT_COMMERCIAL_HEADER_GRID_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_HEADER_TITLE_WRAP_CLASS,
  SHIPMENT_DETAIL_GRID_FIELDS,
  SHIPMENT_DETAIL_LABEL_CLASS,
  SHIPMENT_DETAIL_VALUE_CLASS,
  SHIPMENT_DOCUMENTS_STATUS_LABEL,
  SHIPMENT_HEADER_COMMERCIAL_GRID_CLASS,
  SHIPMENT_TITLE_CELL_CLASS,
  SHIPMENT_TITLE_GRID_CLASS,
  SHIPMENT_TITLE_VALUE_CLASS,
  shipmentTitleParts,
} from "./utils";

export function ShipmentCommercialHeader({ source, workflowStatus }: ShipmentCommercialHeaderProps) {
  const titleParts = shipmentTitleParts(source);

  return (
    <>
      <div className={SHIPMENT_COMMERCIAL_HEADER_TITLE_WRAP_CLASS}>
        <dl className={SHIPMENT_TITLE_GRID_CLASS}>
          {titleParts.map((part) => {
            const isCustomer = part.key === "customer_name";

            return (
              <div key={part.key} className={SHIPMENT_TITLE_CELL_CLASS}>
                <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{part.label}</dt>
                <dd
                  className={`${SHIPMENT_TITLE_VALUE_CLASS}${isCustomer ? " truncate" : " whitespace-nowrap"}`}
                  title={isCustomer && part.value !== "—" ? part.value : undefined}
                >
                  {part.value}
                </dd>
              </div>
            );
          })}
          <div className={SHIPMENT_TITLE_CELL_CLASS}>
            <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{SHIPMENT_DOCUMENTS_STATUS_LABEL}</dt>
            <dd className="mt-1">
              {workflowStatus?.trim() ? (
                <ShipmentWorkflowStatusPill status={workflowStatus} compact />
              ) : (
                <span className="text-sm text-zinc-500">—</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className={SHIPMENT_COMMERCIAL_HEADER_GRID_WRAP_CLASS}>
        <dl className={SHIPMENT_HEADER_COMMERCIAL_GRID_CLASS}>
          {SHIPMENT_DETAIL_GRID_FIELDS.map((field) => {
            const raw = source[field.key];
            const value = field.format(typeof raw === "string" ? raw : raw == null ? null : String(raw));
            return (
              <div key={field.key}>
                <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{field.label}</dt>
                <dd
                  className={`${SHIPMENT_DETAIL_VALUE_CLASS}${"mono" in field && field.mono ? " font-mono text-xs" : ""}`}
                >
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </>
  );
}

export type { ShipmentCommercialHeaderProps, ShipmentCommercialHeaderSource } from "./types";
