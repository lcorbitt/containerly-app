import type { ShipmentCommercialRouteLaneProps } from "./types";

export function formatRoutePort(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function shipmentRouteEndpoints({
  origin,
  destination,
}: ShipmentCommercialRouteLaneProps): { originLabel: string; destinationLabel: string } {
  return {
    originLabel: formatRoutePort(origin),
    destinationLabel: formatRoutePort(destination),
  };
}
