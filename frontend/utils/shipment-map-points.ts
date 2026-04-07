/**
 * Build map geometry from JSON Cargo–shaped `containers.location` / `shipment_context`.
 * Uses explicit lat/lng from the provider when present; otherwise matches common place
 * strings (including the dev mock journey) to approximate coordinates — no paid APIs.
 */

export type ShipmentMapPointKind =
  | "explicit"
  | "origin"
  | "loading"
  | "last"
  | "next"
  | "discharge"
  | "destination";

export type ShipmentMapPoint = {
  lat: number;
  lng: number;
  label: string;
  kind: ShipmentMapPointKind;
};

const COORD_EPS = 0.02;

function normPlace(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-");
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Pull a coordinate pair from flat keys or nested `{ lat, lng }` / GeoJSON-like objects. */
function coordsFromRecord(loc: Record<string, unknown>): { lat: number; lng: number } | null {
  const latKeys = [
    "latitude",
    "lat",
    "last_location_latitude",
    "last_location_lat",
    "current_latitude",
    "current_lat",
  ] as const;
  const lngKeys = [
    "longitude",
    "lng",
    "lon",
    "last_location_longitude",
    "last_location_lng",
    "last_location_lon",
    "current_longitude",
    "current_lng",
    "current_lon",
  ] as const;
  let lat: number | null = null;
  let lng: number | null = null;
  for (const k of latKeys) {
    lat = num(loc[k]);
    if (lat != null) break;
  }
  for (const k of lngKeys) {
    lng = num(loc[k]);
    if (lng != null) break;
  }
  if (lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng };
  }

  const nested = loc.coordinates ?? loc.position ?? loc.geo ?? loc.location_coords;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const o = nested as Record<string, unknown>;
    const la = num(o.lat ?? o.latitude);
    const ln = num(o.lng ?? o.longitude ?? o.lon);
    if (la != null && ln != null && Math.abs(la) <= 90 && Math.abs(ln) <= 180) return { lat: la, lng: ln };
  }
  if (Array.isArray(nested) && nested.length >= 2) {
    const a = num(nested[1]);
    const b = num(nested[0]);
    if (a != null && b != null && Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b };
  }
  return null;
}

/**
 * Substring / phrase rules (order matters: more specific first).
 * Coordinates are approximate centroids for route visualization.
 */
const PLACE_RULES: readonly { test: (n: string) => boolean; lat: number; lng: number }[] = [
  { test: (n) => n.includes("LOS ANGELES ANCHORAGE"), lat: 33.72, lng: -118.32 },
  { test: (n) => n.includes("LONG BEACH") || n.includes("LGB"), lat: 33.765, lng: -118.215 },
  { test: (n) => n.includes("LOS ANGELES") || n.includes("LA, US"), lat: 34.0522, lng: -118.2437 },
  { test: (n) => n.includes("APM TERMINALS PIER 400"), lat: 33.718, lng: -118.27 },
  { test: (n) => n.includes("YANGSHAN") || n.includes("SHANGHAI CNTS"), lat: 30.62, lng: 122.08 },
  { test: (n) => n.includes("KUNSHAN"), lat: 31.3856, lng: 120.9807 },
  { test: (n) => n.includes("NANHUI") || n.includes("INTERMODAL RAMP"), lat: 30.85, lng: 121.75 },
  { test: (n) => n.includes("SHANGHAI"), lat: 31.2304, lng: 121.4737 },
  { test: (n) => n.includes("BUSAN") || n.includes("PUSAN"), lat: 35.1796, lng: 129.0756 },
  { test: (n) => n.includes("EAST CHINA SEA"), lat: 30.0, lng: 126.0 },
  { test: (n) => n.includes("PACIFIC OCEAN"), lat: 38.0, lng: -165.0 },
  { test: (n) => n.includes("CUSTOMS") && n.includes("BUSAN"), lat: 35.16, lng: 129.05 },
];

function inferCoordsFromLabel(label: string): { lat: number; lng: number } | null {
  const n = normPlace(label);
  if (!n) return null;
  for (const r of PLACE_RULES) {
    if (r.test(n)) return { lat: r.lat, lng: r.lng };
  }
  return null;
}

function strField(loc: Record<string, unknown>, key: string): string | null {
  const v = loc[key];
  if (v == null) return null;
  const t = String(v).trim();
  return t || null;
}

function pushDeduped(
  out: ShipmentMapPoint[],
  lat: number,
  lng: number,
  label: string,
  kind: ShipmentMapPointKind,
) {
  const last = out[out.length - 1];
  if (
    last &&
    Math.abs(last.lat - lat) < COORD_EPS &&
    Math.abs(last.lng - lng) < COORD_EPS
  ) {
    return;
  }
  out.push({ lat, lng, label, kind });
}

/**
 * Ordered route points for polyline + markers (origin → corridor → last → next → destination).
 */
export function buildShipmentMapPoints(location: Record<string, unknown> | null | undefined): ShipmentMapPoint[] {
  if (!location || typeof location !== "object") return [];

  const explicit = coordsFromRecord(location);
  if (explicit) {
    const lastLabel =
      strField(location, "last_location") ??
      strField(location, "last_location_terminal") ??
      "Reported position";
    return [{ ...explicit, label: lastLabel, kind: "explicit" }];
  }

  const out: ShipmentMapPoint[] = [];

  const tryField = (key: string, kind: ShipmentMapPointKind) => {
    const label = strField(location, key);
    if (!label) return;
    const c = inferCoordsFromLabel(label);
    if (!c) return;
    pushDeduped(out, c.lat, c.lng, label, kind);
  };

  tryField("shipped_from", "origin");
  tryField("loading_port", "loading");
  tryField("last_location", "last");
  tryField("next_location", "next");
  tryField("discharging_port", "discharge");
  tryField("shipped_to", "destination");

  return out;
}

export function shipmentMapPointsToLatLngs(points: ShipmentMapPoint[]): [number, number][] {
  return points.map((p) => [p.lat, p.lng] as [number, number]);
}
