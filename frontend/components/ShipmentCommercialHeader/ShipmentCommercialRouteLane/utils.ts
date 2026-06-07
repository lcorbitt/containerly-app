import { formatShipmentDate } from "../utils";
import type { RouteEndpointDate, ShipmentCommercialRouteLaneProps } from "./types";

export function formatRoutePort(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function routeEndpointDate(
  kind: "etd" | "eta",
  iso: string | null | undefined,
): RouteEndpointDate | null {
  const trimmed = iso?.trim();
  if (!trimmed) return null;

  const formatted = formatShipmentDate(trimmed);
  if (formatted === "—") return null;

  return {
    label: kind === "etd" ? "ETD" : "ETA",
    date: formatted,
    iso: trimmed,
  };
}

export function shipmentRouteEndpoints({
  origin,
  destination,
  estimatedDepartureAt,
  estimatedArrivalAt,
}: ShipmentCommercialRouteLaneProps): {
  originLabel: string;
  destinationLabel: string;
  originDate: RouteEndpointDate | null;
  destinationDate: RouteEndpointDate | null;
} {
  return {
    originLabel: formatRoutePort(origin),
    destinationLabel: formatRoutePort(destination),
    originDate: routeEndpointDate("etd", estimatedDepartureAt),
    destinationDate: routeEndpointDate("eta", estimatedArrivalAt),
  };
}
