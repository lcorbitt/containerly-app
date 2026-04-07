"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { buildShipmentMapPoints } from "@/utils/shipment-map-points";

const ShipmentTrackingMapInner = dynamic(
  () =>
    import("@/components/ShipmentTrackingMapInner").then((m) => ({
      default: m.ShipmentTrackingMapInner,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
        Loading map…
      </div>
    ),
  },
);

export function ShipmentTrackingMapPanel({
  location,
  className = "",
  headingId,
}: {
  location: Record<string, unknown> | null | undefined;
  className?: string;
  /** Optional id for aria-labelledby on the map region */
  headingId?: string;
}) {
  const points = useMemo(() => buildShipmentMapPoints(location ?? null), [location]);

  if (points.length === 0) {
    return (
      <div
        className={`flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/30 ${className}`}
        role="region"
        aria-labelledby={headingId}
      >
        <MapPin className="h-8 w-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} aria-hidden />
        <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
          No mappable coordinates yet. When your provider sends latitude and longitude (or recognizable place
          names we can match), a route and markers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={className} role="region" aria-labelledby={headingId}>
      <ShipmentTrackingMapInner points={points} />
      <p className="mt-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
        OpenStreetMap and other free tile layers — use the layer control (top-right) to switch style. Place
        positions are approximate when inferred from names.
      </p>
    </div>
  );
}
