/**
 * Maps JSON Cargo `data` into `containers.location`. Keys must stay aligned with
 * `frontend/lib/jsoncargo-display.ts` (labels / order).
 *
 * Order matches JSON Cargo container payload (see provider docs / sample responses).
 */
export const JSON_CARGO_LOCATION_KEYS = [
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

const KEY_SET = new Set<string>(JSON_CARGO_LOCATION_KEYS);

function isStorablePrimitive(v: unknown): v is string | number | boolean {
  const t = typeof v;
  return t === "string" || t === "number" || t === "boolean";
}

/** Copy JSON Cargo `data` into a jsonb-safe blob; include any extra primitive fields from the provider. */
export function buildJsonCargoLocation(inner: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of JSON_CARGO_LOCATION_KEYS) {
    const v = inner[k];
    if (v !== undefined && v !== null && v !== "") {
      out[k] = v;
    }
  }
  for (const [k, v] of Object.entries(inner)) {
    if (KEY_SET.has(k)) continue;
    if (v === undefined || v === null || v === "") continue;
    if (isStorablePrimitive(v)) {
      out[k] = v;
    }
  }
  return out;
}
