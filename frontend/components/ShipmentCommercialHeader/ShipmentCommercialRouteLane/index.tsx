import { ArrowRight } from "lucide-react";
import {
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ARROW_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_META_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_PORT_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ROUTE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CONNECTOR_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_DESTINATION_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ETA_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_LINE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ORIGIN_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_VALUE_CLASS,
} from "./constants";
import type { ShipmentCommercialRouteLaneProps } from "./types";
import { shipmentRouteEndpoints, shipmentRouteMetaLine } from "./utils";

export function ShipmentCommercialRouteLane({
  origin,
  destination,
  estimatedDepartureAt,
  estimatedArrivalAt,
  className,
  variant = "detailed",
}: ShipmentCommercialRouteLaneProps) {
  const { originLabel, destinationLabel, originEta, destinationEta } = shipmentRouteEndpoints({
    origin,
    destination,
    estimatedDepartureAt,
    estimatedArrivalAt,
  });

  if (variant === "compact") {
    const metaLine = shipmentRouteMetaLine(originEta, destinationEta);

    return (
      <div className={className ? `${SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_CLASS} ${className}` : SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_CLASS}>
        <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ROUTE_CLASS}>
          <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_PORT_CLASS} title={originLabel !== "—" ? originLabel : undefined}>
            {originLabel}
          </span>
          <ArrowRight className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ARROW_CLASS} strokeWidth={2.25} aria-hidden />
          <span
            className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_PORT_CLASS}
            title={destinationLabel !== "—" ? destinationLabel : undefined}
          >
            {destinationLabel}
          </span>
        </div>
        {metaLine ? (
          <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_META_CLASS} title={metaLine}>
            {metaLine}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className ? `${SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS} ${className}` : SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS}>
      <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_ORIGIN_CLASS}>
        <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_LABEL_CLASS}>Origin</p>
        <p
          className={SHIPMENT_COMMERCIAL_ROUTE_LANE_VALUE_CLASS}
          title={originLabel !== "—" ? originLabel : undefined}
        >
          {originLabel}
        </p>
        {originEta ? (
          <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_ETA_CLASS} title={originEta}>
            {originEta}
          </p>
        ) : null}
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
        {destinationEta ? (
          <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_ETA_CLASS} title={destinationEta}>
            {destinationEta}
          </p>
        ) : null}
      </div>
    </div>
  );
}
