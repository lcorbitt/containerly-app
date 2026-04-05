/**
 * JSONCargo-style HTTP client (container + BOL + vessel + port).
 * Base URL should include /api/v1 (e.g. http://host:9999/api/v1).
 */

function headers(baseUrl: string, apiKey: string): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  const useApiKey =
    /jsoncargo\.com/i.test(baseUrl) || Deno.env.get("EXTERNAL_TRACKING_AUTH") === "x-api-key";
  if (useApiKey) h["x-api-key"] = apiKey;
  else h["Authorization"] = `Bearer ${apiKey}`;
  return h;
}

export function getJsoncargoConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = Deno.env.get("EXTERNAL_TRACKING_API_URL")?.replace(/\/$/, "") ?? "";
  const apiKey = Deno.env.get("EXTERNAL_TRACKING_API_KEY") ?? "";
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

export async function fetchBolContainers(
  baseUrl: string,
  apiKey: string,
  bol: string,
  opts?: { shippingLine?: string | null },
): Promise<Record<string, unknown>> {
  let url = `${baseUrl}/bill-of-lading/${encodeURIComponent(bol.trim())}`;
  const sl = opts?.shippingLine?.trim();
  if (sl) {
    url += `?${new URLSearchParams({ shipping_line: sl }).toString()}`;
  }
  const res = await fetch(url, { headers: headers(baseUrl, apiKey) });
  if (!res.ok) throw new Error(`BOL API ${res.status}: ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function fetchVesselLivePro(
  baseUrl: string,
  apiKey: string,
  vesselUuid: string,
): Promise<Record<string, unknown>> {
  const url = `${baseUrl}/vessels/live/${encodeURIComponent(vesselUuid)}`;
  const res = await fetch(url, { headers: headers(baseUrl, apiKey) });
  if (!res.ok) throw new Error(`Vessel live ${res.status}: ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function fetchVesselLiveBulk(
  baseUrl: string,
  apiKey: string,
  uuids: string[],
): Promise<Record<string, unknown>> {
  const url = `${baseUrl}/vessels/live/bulk`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers(baseUrl, apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({ uuids }),
  });
  if (!res.ok) throw new Error(`Vessel bulk ${res.status}: ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function fetchVesselFinder(
  baseUrl: string,
  apiKey: string,
  name: string,
): Promise<Record<string, unknown>> {
  const q = new URLSearchParams({ name: name.trim() });
  const url = `${baseUrl}/vessels/find?${q}`;
  const res = await fetch(url, { headers: headers(baseUrl, apiKey) });
  if (!res.ok) throw new Error(`Vessel finder ${res.status}: ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function fetchVesselSpecs(
  baseUrl: string,
  apiKey: string,
  vesselUuid: string,
): Promise<Record<string, unknown>> {
  const url = `${baseUrl}/vessels/${encodeURIComponent(vesselUuid)}/specs`;
  const res = await fetch(url, { headers: headers(baseUrl, apiKey) });
  if (!res.ok) throw new Error(`Vessel specs ${res.status}: ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function fetchPortFinder(
  baseUrl: string,
  apiKey: string,
  query: string,
): Promise<Record<string, unknown>> {
  const q = new URLSearchParams({ q: query.trim() });
  const url = `${baseUrl}/ports/find?${q}`;
  const res = await fetch(url, { headers: headers(baseUrl, apiKey) });
  if (!res.ok) throw new Error(`Port finder ${res.status}: ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}
