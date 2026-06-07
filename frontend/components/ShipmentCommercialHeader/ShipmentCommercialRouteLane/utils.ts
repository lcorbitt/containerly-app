import { formatShipmentDate } from "../utils";
import type { ShipmentCommercialRouteLaneProps } from "./types";

export function formatRoutePort(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function routeEndpointEta(
  kind: "etd" | "eta",
  iso: string | null | undefined,
): string | null {
  const formatted = formatShipmentDate(iso);
  if (formatted === "—") return null;
  return kind === "etd" ? `ETD ${formatted}` : `ETA ${formatted}`;
}

export function shipmentRouteEndpoints({
  origin,
  destination,
  estimatedDepartureAt,
  estimatedArrivalAt,
}: ShipmentCommercialRouteLaneProps): {
  originLabel: string;
  destinationLabel: string;
  originEta: string | null;
  destinationEta: string | null;
} {
  return {
    originLabel: formatRoutePort(origin),
    destinationLabel: formatRoutePort(destination),
    originEta: routeEndpointEta("etd", estimatedDepartureAt),
    destinationEta: routeEndpointEta("eta", estimatedArrivalAt),
  };
}

export function shipmentRouteMetaLine(originEta: string | null, destinationEta: string | null): string | null {
  const parts = [originEta, destinationEta].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}
