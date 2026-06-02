import { SHIPMENT_COMMERCIAL_LABEL_CLASS } from "@/components/ShipmentCommercialFormFields/utils";
import type { ShipmentCommercialHeaderSource } from "./types";

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

export const SHIPMENT_DETAIL_LABEL_CLASS = SHIPMENT_COMMERCIAL_LABEL_CLASS;

export const SHIPMENT_DETAIL_VALUE_CLASS = "mt-0.5 text-sm text-zinc-900 dark:text-zinc-100";

export const SHIPMENT_HEADER_COMMERCIAL_GRID_CLASS = "grid gap-4 sm:grid-cols-3 lg:grid-cols-4";

export const SHIPMENT_TITLE_VALUE_CLASS =
  "mt-0.5 text-lg font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50";

export const SHIPMENT_TITLE_PRIMARY_GRID_CLASS =
  "grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-0";

export const SHIPMENT_TITLE_SECONDARY_ROW_CLASS = "min-w-0";

export const SHIPMENT_TITLE_CELL_CLASS = "min-w-0";

/** Matches ShipmentDetailsCard outer border (`border-zinc-200` / `dark:border-zinc-800`). */
export const SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS = "border-zinc-200 dark:border-zinc-800";

export const SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROW_CLASS = `grid grid-cols-1 gap-5 border-b pb-4 md:grid-cols-2 md:items-center md:gap-6 ${SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS}`;

export const SHIPMENT_COMMERCIAL_HEADER_SUMMARY_TITLE_COL_CLASS =
  "flex min-w-0 flex-col gap-3";

export const SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROUTE_COL_CLASS = `flex min-w-0 flex-col justify-center md:border-l md:pl-6 ${SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS}`;

export const SHIPMENT_COMMERCIAL_HEADER_GRID_WRAP_CLASS = "pt-4";

export const SHIPMENT_DETAIL_FIELDS = [
  { key: "customer_name", label: "Customer", format: displayValue },
  { key: "order_number", label: "Order No", format: displayValue },
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

export const SHIPMENT_DOCUMENTS_STATUS_LABEL = "Documents status";

export const SHIPMENT_TITLE_FIELD_KEYS = ["customer_name", "order_number"] as const;

export const SHIPMENT_ROUTE_FIELD_KEYS = ["port_of_loading", "port_of_destination"] as const;

export const SHIPMENT_ETA_FIELD_KEYS = ["estimated_departure_at", "estimated_arrival_at"] as const;

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
