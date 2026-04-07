/**
 * Display labels and ordering for JSON Cargo–shaped `containers.location` / API `data` blobs.
 * Keep aligned with `supabase/functions/_shared/jsoncargoLocation.ts` key list.
 */

import { formatTimestamp } from "@/utils/datetime";

/** Keys whose values are normally ISO instants in carrier payloads (container details modal, etc.). */
const JSONCARGO_DATETIME_KEYS = new Set<string>([
  "atd_origin",
  "eta_final_destination",
  "atd_last_location",
  "eta_next_destination",
  "timestamp_of_last_location",
  "last_movement_timestamp",
  "last_updated",
]);

function isIsoLikeDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(s.trim());
}

export const JSONCARGO_FIELD_ORDER: readonly string[] = [
  "container_id",
  "container_type",
  "container_status",
  "shipping_line_name",
  "shipping_line_id",
  "tare",
  "shipped_from",
  "shipped_from_terminal",
  "shipped_to",
  "shipped_to_terminal",
  "atd_origin",
  "eta_final_destination",
  "last_location",
  "last_location_terminal",
  "next_location",
  "next_location_terminal",
  "atd_last_location",
  "eta_next_destination",
  "timestamp_of_last_location",
  "last_movement_timestamp",
  "loading_port",
  "discharging_port",
  "customs_clearance",
  "bill_of_lading",
  "last_vessel_name",
  "last_voyage_number",
  "current_vessel_name",
  "current_voyage_number",
  "last_updated",
] as const;

const ORDER_SET = new Set<string>(JSONCARGO_FIELD_ORDER);

export const JSONCARGO_LABELS: Record<string, string> = {
  container_id: "Container ID (provider)",
  container_type: "Container type",
  container_status: "Container status (carrier)",
  shipping_line_name: "Shipping line",
  shipping_line_id: "Line code",
  tare: "Tare weight",
  shipped_from: "Origin",
  shipped_from_terminal: "Origin terminal",
  shipped_to: "Destination",
  shipped_to_terminal: "Destination terminal",
  atd_origin: "Departed origin (ATD)",
  eta_final_destination: "ETA — final destination",
  last_location: "Last reported location",
  last_location_terminal: "At facility / terminal",
  next_location: "Next location",
  next_location_terminal: "Next facility",
  atd_last_location: "ATD — last location",
  eta_next_destination: "ETA — next stop",
  timestamp_of_last_location: "Position reported at",
  last_movement_timestamp: "Last movement",
  loading_port: "Loading port",
  discharging_port: "Discharging port",
  customs_clearance: "Customs clearance",
  bill_of_lading: "Bill of lading",
  last_vessel_name: "Last vessel",
  last_voyage_number: "Last voyage",
  current_vessel_name: "Current vessel",
  current_voyage_number: "Current voyage",
  last_updated: "Carrier data updated",
};

function humanizeUnknownFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatValue(key: string, raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  if (typeof raw === "number" && Number.isFinite(raw)) {
    if (key === "tare") return `${raw.toLocaleString()} kg`;
    return String(raw);
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return "";
    const ms = Date.parse(t);
    if (
      !Number.isNaN(ms) &&
      (JSONCARGO_DATETIME_KEYS.has(key) || isIsoLikeDateString(t))
    ) {
      return formatTimestamp(t);
    }
    return t;
  }
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

export type ShipmentDetailRow = { key: string; label: string; value: string };

/** Rows for UI: known fields in canonical order, then any other keys on the blob (sorted). */
export function getShipmentDetailRows(loc: Record<string, unknown> | null | undefined): ShipmentDetailRow[] {
  if (!loc || typeof loc !== "object") return [];
  const rows: ShipmentDetailRow[] = [];

  for (const key of JSONCARGO_FIELD_ORDER) {
    const raw = loc[key];
    const value = formatValue(key, raw);
    if (!value) continue;
    rows.push({
      key,
      label: JSONCARGO_LABELS[key] ?? humanizeUnknownFieldKey(key),
      value,
    });
  }

  const extraKeys = Object.keys(loc)
    .filter((k) => !ORDER_SET.has(k))
    .sort((a, b) => a.localeCompare(b));

  for (const key of extraKeys) {
    const raw = loc[key];
    const value = formatValue(key, raw);
    if (!value) continue;
    rows.push({
      key,
      label: JSONCARGO_LABELS[key] ?? humanizeUnknownFieldKey(key),
      value,
    });
  }

  return rows;
}

/**
 * Shipper / receiver summary from JSON Cargo origin & destination fields (`shipped_from` / `shipped_to`
 * and optional terminals). Matches seed and live provider payloads.
 */
export function shipperReceiverFromLocation(loc: Record<string, unknown> | null | undefined): {
  shipper: string | null;
  receiver: string | null;
} {
  if (!loc || typeof loc !== "object") return { shipper: null, receiver: null };
  const line = (place: string, terminal: string) => {
    const p = place.trim();
    const t = terminal.trim();
    if (p && t) return `${p} · ${t}`;
    return p || t || null;
  };
  return {
    shipper: line(String(loc.shipped_from ?? ""), String(loc.shipped_from_terminal ?? "")),
    receiver: line(String(loc.shipped_to ?? ""), String(loc.shipped_to_terminal ?? "")),
  };
}
