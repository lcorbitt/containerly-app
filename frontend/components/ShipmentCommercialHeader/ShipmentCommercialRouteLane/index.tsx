import { ArrowRight } from "lucide-react";
import {
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CONNECTOR_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_DESTINATION_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_LINE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ORIGIN_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_VALUE_CLASS,
} from "./constants";
import type { ShipmentCommercialRouteLaneProps } from "./types";
import { shipmentRouteEndpoints } from "./utils";

export function ShipmentCommercialRouteLane({ origin, destination }: ShipmentCommercialRouteLaneProps) {
  const { originLabel, destinationLabel } = shipmentRouteEndpoints({ origin, destination });

  return (
    <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS}>
      <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_ORIGIN_CLASS}>
        <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_LABEL_CLASS}>Origin</p>
        <p
          className={SHIPMENT_COMMERCIAL_ROUTE_LANE_VALUE_CLASS}
          title={originLabel !== "—" ? originLabel : undefined}
        >
          {originLabel}
        </p>
      </div>

      <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_CONNECTOR_CLASS} aria-hidden>
        <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_LINE_CLASS} />
        <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_WRAP_CLASS}>
          <ArrowRight className={SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_CLASS} strokeWidth={2.25} />
        </span>
        <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_LINE_CLASS} />
      </div>

      <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DESTINATION_CLASS}>
        <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_LABEL_CLASS}>Destination</p>
        <p
          className={SHIPMENT_COMMERCIAL_ROUTE_LANE_VALUE_CLASS}
          title={destinationLabel !== "—" ? destinationLabel : undefined}
        >
          {destinationLabel}
        </p>
      </div>
    </div>
  );
}
