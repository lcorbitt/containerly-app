"use client";

/**
 * AIS / vessel enrichment from `containers.enrichment` (JSONCargo mock or live).
 */
export function VesselEnrichmentCard({ enrichment }: { enrichment: Record<string, unknown> }) {
  const ais = enrichment.vessel_ais as Record<string, unknown> | undefined;
  if (!ais || typeof ais !== "object") {
    return (
      <div className="rounded-xl border border-zinc-200/90 bg-white p-4 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        No live vessel (AIS) data for this shipment yet. It appears after the next carrier sync when the external API
        is configured.
      </div>
    );
  }

  const specs = enrichment.vessel_specs as Record<string, unknown> | undefined;
  const name = String(ais.name ?? "Vessel");
  const lat = ais.lat != null ? Number(ais.lat) : null;
  const lon = ais.lon != null ? Number(ais.lon) : null;
  const speed = ais.speed != null ? String(ais.speed) : "—";
  const eta = ais.eta_UTC != null ? String(ais.eta_UTC) : "—";
  const lastPos = ais.last_position_UTC != null ? String(ais.last_position_UTC) : "—";

  return (
    <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/25 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
            Live vessel (AIS)
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">{name}</h3>
          <p className="mt-1 text-xs text-sky-900/80 dark:text-sky-200/80">
            Indicative only — not a substitute for carrier milestones or contractual ETAs.
          </p>
        </div>
        {specs?.teu != null ? (
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200">
            ~{String(specs.teu)} TEU
          </span>
        ) : null}
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Position (last fix)</dt>
          <dd className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">
            {lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)
              ? `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
              : "—"}
          </dd>
          <dd className="text-xs text-zinc-500">{lastPos}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Speed (kn)</dt>
          <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">{speed}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">AIS ETA (UTC)</dt>
          <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">{eta}</dd>
        </div>
      </dl>
    </div>
  );
}
