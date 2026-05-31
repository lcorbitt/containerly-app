import { ShipmentWorkflowStatusPill } from "@/components/StatusPills";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import {
  SHIPMENT_DETAIL_LABEL_CLASS,
  SHIPMENT_DOCUMENTS_STATUS_LABEL,
  SHIPMENT_TITLE_CELL_CLASS,
  SHIPMENT_TITLE_GRID_CLASS,
  SHIPMENT_TITLE_VALUE_CLASS,
  shipmentTitleParts,
} from "./utils";

export function ShipmentTitleHeading({
  row,
  workflowStatus,
  className,
}: {
  row: Pick<ShipmentWorkspaceRow, "customer_name" | "order_number">;
  workflowStatus?: string | null;
  className?: string;
}) {
  const parts = shipmentTitleParts(row);

  return (
    <dl className={`${SHIPMENT_TITLE_GRID_CLASS} ${className ?? ""}`.trim()}>
      {parts.map((part) => {
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
  );
}
