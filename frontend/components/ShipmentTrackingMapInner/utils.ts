import type { ShipmentMapPoint } from "@/utils/shipment-map-points";

export function kindLabel(kind: ShipmentMapPoint["kind"]): string {
  switch (kind) {
    case "explicit":
      return "Reported coordinates";
    case "origin":
      return "Origin";
    case "loading":
      return "Loading";
    case "last":
      return "Last known";
    case "next":
      return "Next";
    case "discharge":
      return "Discharge";
    case "destination":
      return "Destination";
    default:
      return "Location";
  }
}
