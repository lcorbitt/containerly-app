import {
  fetchPortFinder,
  fetchVesselFinder,
  fetchVesselLivePro,
  fetchVesselSpecs,
} from "./client.ts";

/** Stable mock UUID for MSC LORETO (matches mock-jsoncargo-server). */
export const MOCK_VESSEL_UUID_MSC_LORETO = "a1111111-1111-4111-8111-111111111111";

function pickVesselUuid(finderData: Record<string, unknown>, vesselName: string): string | null {
  const raw = finderData.data;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const needle = vesselName.toLowerCase().replace(/\s+/g, " ").trim();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const n = String(r.name ?? r.name_ais ?? "").toLowerCase().trim();
    if (!n) continue;
    if (needle.includes(n.slice(0, Math.min(8, n.length))) || n.includes(needle.slice(0, Math.min(8, needle.length)))) {
      const u = r.uuid;
      if (typeof u === "string") return u;
    }
  }
  const first = raw[0] as Record<string, unknown>;
  return typeof first.uuid === "string" ? first.uuid : null;
}

function firstPortLatLon(portData: Record<string, unknown>): { lat: number; lon: number; label: string } | null {
  const raw = portData.data;
  if (!Array.isArray(raw) || !raw[0] || typeof raw[0] !== "object") return null;
  const p = raw[0] as Record<string, unknown>;
  const lat = Number(p.lat);
  const lon = Number(p.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const label = [p.port_name, p.unlocode].filter(Boolean).join(" · ");
  return { lat, lon, label: label || "Port" };
}

/**
 * Best-effort enrichment after container details sync. Never throws to caller.
 */
export async function buildContainerEnrichment(
  baseUrl: string,
  apiKey: string,
  location: Record<string, unknown> | null,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {
    source_last_fetched_at: new Date().toISOString(),
  };
  if (!location || typeof location !== "object") return out;

  const vesselName = String(
    location.current_vessel_name ?? location.last_vessel_name ?? "",
  ).trim();
  if (!vesselName) return out;

  try {
    const finder = await fetchVesselFinder(baseUrl, apiKey, vesselName);
    out.vessel_finder = finder;
    let uuid = pickVesselUuid(finder, vesselName);
    if (!uuid && /loreto/i.test(vesselName)) uuid = MOCK_VESSEL_UUID_MSC_LORETO;
    if (!uuid) return out;

    const [liveEnvelope, specsEnvelope] = await Promise.all([
      fetchVesselLivePro(baseUrl, apiKey, uuid).catch(() => null),
      fetchVesselSpecs(baseUrl, apiKey, uuid).catch(() => null),
    ]);

    if (liveEnvelope) {
      const d = liveEnvelope.data as Record<string, unknown> | undefined;
      if (d && typeof d === "object") out.vessel_ais = d;
    }
    if (specsEnvelope) {
      const d = specsEnvelope.data as Record<string, unknown> | undefined;
      if (d && typeof d === "object") out.vessel_specs = d;
    }

    const discharge = String(location.discharging_port ?? location.shipped_to ?? "").trim();
    if (discharge.length >= 3) {
      const ports = await fetchPortFinder(baseUrl, apiKey, discharge.split(",")[0] ?? discharge).catch(
        () => null,
      );
      if (ports) {
        out.port_hint = ports;
        const pin = firstPortLatLon(ports);
        if (pin) out.discharge_port_pin = pin;
      }
    }
  } catch {
    /* ignore enrichment failures */
  }

  return out;
}
