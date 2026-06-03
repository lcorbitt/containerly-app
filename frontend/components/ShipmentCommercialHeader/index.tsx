"use client";

import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import { ShipmentCommercialRouteLane } from "./ShipmentCommercialRouteLane";
import type { ShipmentCommercialHeaderProps } from "./types";
import {
  SHIPMENT_COMMERCIAL_HEADER_GRID_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROW_CLASS,
  SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROUTE_COL_CLASS,
  SHIPMENT_COMMERCIAL_HEADER_SUMMARY_TITLE_COL_CLASS,
  SHIPMENT_DETAIL_LABEL_CLASS,
  SHIPMENT_DETAIL_VALUE_CLASS,
  SHIPMENT_DOCUMENTS_STATUS_LABEL,
  SHIPMENT_HEADER_COMMERCIAL_GRID_CLASS,
  SHIPMENT_TITLE_CELL_CLASS,
  SHIPMENT_TITLE_PRIMARY_GRID_CLASS,
  SHIPMENT_TITLE_SECONDARY_ROW_CLASS,
  SHIPMENT_TITLE_VALUE_CLASS,
} from "./constants";
import { SHIPMENT_DETAIL_GRID_FIELDS, shipmentTitleParts } from "./utils";

export function ShipmentCommercialHeader({ source, workflowStatus }: ShipmentCommercialHeaderProps) {
  const titleParts = shipmentTitleParts(source);
  const customerPart = titleParts.find((part) => part.key === "customer_name");
  const orderPart = titleParts.find((part) => part.key === "order_number");

  return (
    <>
      <div className={SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROW_CLASS}>
        <div className={SHIPMENT_COMMERCIAL_HEADER_SUMMARY_TITLE_COL_CLASS}>
          <dl className={SHIPMENT_TITLE_PRIMARY_GRID_CLASS}>
            {customerPart ? (
              <div className={SHIPMENT_TITLE_CELL_CLASS}>
                <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{customerPart.label}</dt>
                <dd
                  className={`${SHIPMENT_TITLE_VALUE_CLASS} truncate`}
                  title={customerPart.value !== "—" ? customerPart.value : undefined}
                >
                  {customerPart.value}
                </dd>
              </div>
            ) : null}
            <div className={SHIPMENT_TITLE_CELL_CLASS}>
              <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{SHIPMENT_DOCUMENTS_STATUS_LABEL}</dt>
              <dd className="mt-0.5">
                {workflowStatus?.trim() ? (
                  <ShipmentWorkflowStatusPill status={workflowStatus} compact />
                ) : (
                  <span className="text-sm text-zinc-500">—</span>
                )}
              </dd>
            </div>
          </dl>
          {orderPart ? (
            <dl className={SHIPMENT_TITLE_SECONDARY_ROW_CLASS}>
              <div className={SHIPMENT_TITLE_CELL_CLASS}>
                <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{orderPart.label}</dt>
                <dd className={`${SHIPMENT_TITLE_VALUE_CLASS} whitespace-nowrap`}>{orderPart.value}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className={SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROUTE_COL_CLASS}>
          <ShipmentCommercialRouteLane
            origin={source.port_of_loading}
            destination={source.port_of_destination}
            estimatedDepartureAt={source.estimated_departure_at}
            estimatedArrivalAt={source.estimated_arrival_at}
          />
        </div>
      </div>

      <div className={SHIPMENT_COMMERCIAL_HEADER_GRID_WRAP_CLASS}>
        <dl className={SHIPMENT_HEADER_COMMERCIAL_GRID_CLASS}>
          {SHIPMENT_DETAIL_GRID_FIELDS.map((field) => {
            const raw = source[field.key];
            const value = field.format(typeof raw === "string" ? raw : raw == null ? null : String(raw));
            return (
              <div key={field.key}>
                <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{field.label}</dt>
                <dd className={SHIPMENT_DETAIL_VALUE_CLASS}>
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
