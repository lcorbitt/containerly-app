import type { ShipmentCommercialHeaderSource } from "./types";
import {
  SHIPMENT_ETA_FIELD_KEYS,
  SHIPMENT_ROUTE_FIELD_KEYS,
  SHIPMENT_TITLE_FIELD_KEYS,
} from "./constants";

export function formatShipmentDate(value: string | null | undefined): string {
  if (!value?.trim()) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export const SHIPMENT_DETAIL_FIELDS = [
  { key: "customer_name", label: "Customer", format: displayValue },
  { key: "order_number", label: "Order No.", format: displayValue },
  { key: "carrier_booking_number", label: "Carrier Booking No.", format: displayValue },
  { key: "container_number", label: "Container No.", format: displayValue, mono: true },
  { key: "country", label: "Country", format: displayValue },
  { key: "port_of_loading", label: "Port of Loading", format: displayValue },
  { key: "port_of_destination", label: "Port of Destination", format: displayValue },
  { key: "estimated_departure_at", label: "Est Date of Departure", format: formatShipmentDate },
  { key: "estimated_arrival_at", label: "Est Date of Arrival", format: formatShipmentDate },
  { key: "freight_booking_carrier", label: "Freight Booking Carrier", format: displayValue },
  { key: "vessel", label: "Vessel", format: displayValue },
  { key: "voyage", label: "Voyage", format: displayValue },
  { key: "health_certificate_no", label: "Health Certificate No.", format: displayValue },
  { key: "trade_terms", label: "Trade Terms", format: displayValue },
] as const;

export const SHIPMENT_DETAIL_GRID_FIELDS = SHIPMENT_DETAIL_FIELDS.filter(
  (field) =>
    !(SHIPMENT_TITLE_FIELD_KEYS as readonly string[]).includes(field.key) &&
    !(SHIPMENT_ROUTE_FIELD_KEYS as readonly string[]).includes(field.key) &&
    !(SHIPMENT_ETA_FIELD_KEYS as readonly string[]).includes(field.key),
);

export function shipmentTitleParts(source: Pick<ShipmentCommercialHeaderSource, "customer_name" | "order_number">) {
  return SHIPMENT_TITLE_FIELD_KEYS.map((key) => {
    const field = SHIPMENT_DETAIL_FIELDS.find((f) => f.key === key)!;
    const raw = source[key];
    const value = field.format(typeof raw === "string" ? raw : raw == null ? null : String(raw));
    return { key, label: field.label, value };
  });
}
