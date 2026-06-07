import { ShipmentCommercialRouteLane } from "../ShipmentCommercialRouteLane";
import { ShipmentCommercialSummaryField } from "./ShipmentCommercialSummaryField";
import { shipmentTitleParts } from "../utils";
import {
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_CLASS,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_LANE_CELL_CLASS,
} from "./constants";
import type { ShipmentCommercialSummaryBarProps } from "./types";

export function ShipmentCommercialSummaryBar({ source }: ShipmentCommercialSummaryBarProps) {
  const titleParts = shipmentTitleParts(source);
  const customerPart = titleParts.find((part) => part.key === "customer_name");
  const orderPart = titleParts.find((part) => part.key === "order_number");

  return (
    <div className={SHIPMENT_COMMERCIAL_SUMMARY_BAR_CLASS}>
      {orderPart ? <ShipmentCommercialSummaryField label={orderPart.label} value={orderPart.value} /> : null}

      {customerPart ? (
        <ShipmentCommercialSummaryField
          label={customerPart.label}
          value={customerPart.value}
          consignee={source.consignee}
        />
      ) : null}

      <div className={SHIPMENT_COMMERCIAL_SUMMARY_BAR_LANE_CELL_CLASS}>
        <p className={SHIPMENT_COMMERCIAL_SUMMARY_BAR_LABEL_CLASS}>Lane</p>
        <ShipmentCommercialRouteLane
          variant="compact"
          origin={source.port_of_loading}
          destination={source.port_of_destination}
          estimatedDepartureAt={source.estimated_departure_at}
          estimatedArrivalAt={source.estimated_arrival_at}
          className="mt-1"
        />
      </div>
    </div>
  );
}
