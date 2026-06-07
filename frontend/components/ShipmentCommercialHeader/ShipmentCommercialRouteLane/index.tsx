import { ArrowRight } from "lucide-react";
import {
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ARROW_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATE_CELL_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATES_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_PORT_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ROUTE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CONNECTOR_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_BLOCK_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_VALUE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_DESTINATION_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_LINE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ORIGIN_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_VALUE_CLASS,
} from "./constants";
import type { RouteEndpointDate, ShipmentCommercialRouteLaneProps } from "./types";
import { shipmentRouteEndpoints } from "./utils";

function RouteEndpointDateBlock({
  endpoint,
  align = "start",
  className,
}: {
  endpoint: RouteEndpointDate;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const alignClass =
    align === "center" ? "text-center" : align === "end" ? "text-right" : "text-left";

  return (
    <div
      className={`${SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_BLOCK_CLASS} ${alignClass}${className ? ` ${className}` : ""}`}
    >
      <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_LABEL_CLASS}>{endpoint.label}</p>
      <time dateTime={endpoint.iso} className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_VALUE_CLASS}>
        {endpoint.date}
      </time>
    </div>
  );
}

export function ShipmentCommercialRouteLane({
  origin,
  destination,
  estimatedDepartureAt,
  estimatedArrivalAt,
  className,
  variant = "detailed",
}: ShipmentCommercialRouteLaneProps) {
  const { originLabel, destinationLabel, originDate, destinationDate } = shipmentRouteEndpoints({
    origin,
    destination,
    estimatedDepartureAt,
    estimatedArrivalAt,
  });

  if (variant === "compact") {
    const hasDates = Boolean(originDate || destinationDate);

    return (
      <div
        className={
          className
            ? `${SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_CLASS} ${className}`
            : SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_CLASS
        }
      >
        <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ROUTE_CLASS}>
          <span
            className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_PORT_CLASS}
            title={originLabel !== "—" ? originLabel : undefined}
          >
            {originLabel}
          </span>
          <ArrowRight
            className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ARROW_CLASS}
            strokeWidth={2.25}
            aria-hidden
          />
          <span
            className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_PORT_CLASS}
            title={destinationLabel !== "—" ? destinationLabel : undefined}
          >
            {destinationLabel}
          </span>
        </div>
        {hasDates ? (
          <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATES_CLASS}>
            {originDate ? (
              <RouteEndpointDateBlock
                endpoint={originDate}
                className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATE_CELL_CLASS}
              />
            ) : null}
            {destinationDate ? (
              <RouteEndpointDateBlock
                endpoint={destinationDate}
                className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATE_CELL_CLASS}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        className ? `${SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS} ${className}` : SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS
      }
    >
      <div className={SHIPMENT_COMMERCIAL_ROUTE_LANE_ORIGIN_CLASS}>
        <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_LABEL_CLASS}>Origin</p>
        <p
          className={SHIPMENT_COMMERCIAL_ROUTE_LANE_VALUE_CLASS}
          title={originLabel !== "—" ? originLabel : undefined}
        >
          {originLabel}
        </p>
        {originDate ? <RouteEndpointDateBlock endpoint={originDate} align="center" /> : null}
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
        {destinationDate ? <RouteEndpointDateBlock endpoint={destinationDate} align="center" /> : null}
      </div>
    </div>
  );
}
