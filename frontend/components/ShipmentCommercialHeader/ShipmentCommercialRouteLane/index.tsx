import { ArrowRight } from "lucide-react";
import {
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_ARROW_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ARROW_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATE_ITEM_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATES_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_PORT_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_ROUTE_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_CONNECTOR_CLASS,
  SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_INLINE_CLASS,
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

function RouteEndpointDateInline({ endpoint }: { endpoint: RouteEndpointDate }) {
  return (
    <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATE_ITEM_CLASS}>
      <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_LABEL_CLASS}>{endpoint.label}</span>
      <time dateTime={endpoint.iso} className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_VALUE_CLASS}>
        {endpoint.date}
      </time>
    </span>
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
          <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_COMPACT_DATES_CLASS}>
            {originDate ? <RouteEndpointDateInline endpoint={originDate} /> : null}
            {destinationDate ? <RouteEndpointDateInline endpoint={destinationDate} /> : null}
          </p>
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
        {originDate ? (
          <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_INLINE_CLASS}>
            <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_LABEL_CLASS}>{originDate.label}</span>{" "}
            <time dateTime={originDate.iso} className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_VALUE_CLASS}>
              {originDate.date}
            </time>
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
        {destinationDate ? (
          <p className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_INLINE_CLASS}>
            <span className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_LABEL_CLASS}>{destinationDate.label}</span>{" "}
            <time dateTime={destinationDate.iso} className={SHIPMENT_COMMERCIAL_ROUTE_LANE_DATE_VALUE_CLASS}>
              {destinationDate.date}
            </time>
          </p>
        ) : null}
      </div>
    </div>
  );
}
