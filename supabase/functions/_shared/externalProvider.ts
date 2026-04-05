/**
 * Adapter for JSONCargo-style container APIs.
 * Replace `fetchLiveFromProvider` with real HTTP calls + auth headers.
 */

import { buildJsonCargoLocation } from "./jsoncargoLocation.ts";

export type NormalizedContainer = {
  container_number: string;
  carrier: string | null;
  status: string;
  location: Record<string, unknown> | null;
  occurred_at: string;
  events: Array<{
    event_type: string;
    status: string | null;
    location: Record<string, unknown> | null;
    occurred_at: string;
  }>;
  raw: Record<string, unknown>;
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildContainersUrl(
  baseUrl: string,
  normalizedNumber: string,
  shippingLineOverride?: string | null,
): string {
  const base = baseUrl.replace(/\/$/, "");
  let url = `${base}/containers/${encodeURIComponent(normalizedNumber)}`;
  const shippingLine =
    (shippingLineOverride?.trim() || Deno.env.get("EXTERNAL_TRACKING_SHIPPING_LINE") || "").trim() ||
    null;
  if (shippingLine) {
    const q = new URLSearchParams({ shipping_line: shippingLine });
    url += `?${q.toString()}`;
  }
  return url;
}

function externalRequestHeaders(baseUrl: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const useApiKey =
    /jsoncargo\.com/i.test(baseUrl) ||
    Deno.env.get("EXTERNAL_TRACKING_AUTH") === "x-api-key";
  if (useApiKey) {
    headers["x-api-key"] = apiKey;
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}

export async function fetchLiveFromProvider(
  normalizedNumber: string,
  opts?: { shippingLine?: string | null },
): Promise<NormalizedContainer> {
  const baseUrl = Deno.env.get("EXTERNAL_TRACKING_API_URL");
  const apiKey = Deno.env.get("EXTERNAL_TRACKING_API_KEY");

  if (baseUrl && apiKey) {
    const url = buildContainersUrl(baseUrl, normalizedNumber, opts?.shippingLine);
    const res = await fetch(url, {
      headers: externalRequestHeaders(baseUrl, apiKey),
    });
    if (!res.ok) {
      throw new Error(`External API ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as Record<string, unknown>;
    return mapExternalPayload(normalizedNumber, data);
  }

  // Deterministic mock when no external API is configured
  const h = hashString(normalizedNumber);
  const statuses = ["IN_TRANSIT", "AT_PORT", "CUSTOMS", "DELAYED", "EXCEPTION"];
  const status = statuses[h % statuses.length];
  const now = new Date().toISOString();
  return {
    container_number: normalizedNumber,
    carrier: h % 3 === 0 ? "MSC" : "MAERSK",
    status,
    location: { port: h % 2 === 0 ? "LAX" : "NYC", lat: 34.05, lng: -118.24 },
    occurred_at: now,
    events: [
      {
        event_type: "STATUS_UPDATE",
        status,
        location: { port: "LAST_SEEN" },
        occurred_at: now,
      },
    ],
    raw: {
      source: "mock-provider",
      normalizedNumber,
      shipping_line_request: opts?.shippingLine ?? null,
    },
  };
}

/** JSON Cargo: GET .../containers/{tracking_number}?shipping_line=MSC — body `{ data: { container_id, container_status, ... } }`. */
function mapJsonCargoData(
  normalizedNumber: string,
  inner: Record<string, unknown>,
  rawEnvelope: Record<string, unknown>,
): NormalizedContainer {
  const container_number = String(inner.container_id ?? inner.container_number ?? normalizedNumber);
  const status = String(inner.container_status ?? "UNKNOWN");
  const occurred_at = String(
    inner.last_updated ??
      inner.timestamp_of_last_location ??
      inner.last_movement_timestamp ??
      new Date().toISOString(),
  );
  const location = buildJsonCargoLocation(inner);
  const carrier = inner.shipping_line_name != null ? String(inner.shipping_line_name) : null;
  return {
    container_number,
    carrier,
    status,
    location,
    occurred_at,
    events: [
      {
        event_type: "STATUS",
        status,
        location,
        occurred_at,
      },
    ],
    raw: rawEnvelope,
  };
}

function mapExternalPayload(
  normalizedNumber: string,
  data: Record<string, unknown>,
): NormalizedContainer {
  const nested = data.data;
  if (
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested) &&
    ("container_id" in nested || "container_status" in nested)
  ) {
    return mapJsonCargoData(normalizedNumber, nested as Record<string, unknown>, data);
  }

  const status = String(data.status ?? data.current_status ?? "UNKNOWN");
  const occurred_at = String(data.updated_at ?? data.timestamp ?? new Date().toISOString());
  return {
    container_number: String(data.container_number ?? normalizedNumber),
    carrier: data.carrier != null ? String(data.carrier) : null,
    status,
    location: (data.location as Record<string, unknown>) ?? null,
    occurred_at,
    events: Array.isArray(data.events)
      ? (data.events as Record<string, unknown>[]).map((e) => ({
        event_type: String(e.event_type ?? "EVENT"),
        status: e.status != null ? String(e.status) : null,
        location: (e.location as Record<string, unknown>) ?? null,
        occurred_at: String(e.occurred_at ?? e.timestamp ?? occurred_at),
      }))
      : [],
    raw: data,
  };
}
