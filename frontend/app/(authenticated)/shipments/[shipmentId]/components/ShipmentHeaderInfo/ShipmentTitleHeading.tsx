import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import {
  SHIPMENT_DETAIL_LABEL_CLASS,
  SHIPMENT_TITLE_VALUE_CLASS,
  shipmentTitleParts,
} from "./utils";

export function ShipmentTitleHeading({
  row,
  className,
}: {
  row: Pick<ShipmentWorkspaceRow, "customer_name" | "order_number">;
  className?: string;
}) {
  const parts = shipmentTitleParts(row);

  return (
    <dl className={`flex w-full min-w-0 items-end justify-between gap-6 ${className ?? ""}`.trim()}>
      {parts.map((part) => {
        const isCustomer = part.key === "customer_name";
        const isOrderNumber = part.key === "order_number";

        return (
          <div
            key={part.key}
            className={
              isCustomer
                ? "min-w-0 flex-1"
                : isOrderNumber
                  ? "shrink-0"
                  : undefined
            }
          >
            <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{part.label}</dt>
            <dd
              className={`${SHIPMENT_TITLE_VALUE_CLASS}${
                isCustomer ? " truncate" : isOrderNumber ? " whitespace-nowrap" : ""
              }`}
              title={isCustomer && part.value !== "—" ? part.value : undefined}
            >
              {part.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
