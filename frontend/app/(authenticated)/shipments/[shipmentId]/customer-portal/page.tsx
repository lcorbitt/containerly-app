"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PublicContainerReport } from "@/components/PublicContainerReport";
import { PageLoading } from "@/components/PageLoading";
import { fetchShipment } from "@/services/shipment.service";
import type { PublicReportPayload } from "@/types/public-report";

type Phase = "loading" | "ready" | "error";

/** Operator view of the customer portal, inside the authenticated shell (operator top + side nav). */
export default function OperatorCustomerPortalPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = use(params);
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<PublicReportPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase("loading");
      setErr(null);

      const r = await fetchShipment(shipmentId);
      if (cancelled) return;

      if (r.ok) {
        setData(r.data);
        setPhase("ready");
        return;
      }

      setErr(r.error);
      setPhase("error");
    })();

    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  if (phase === "loading") {
    return <PageLoading loadingText="Loading customer portal…" />;
  }

  if (phase === "error" || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {err ?? "Could not load the customer portal for this shipment."}
        </p>
        <p className="mt-6">
          <Link
            href={`/shipments/${shipmentId}`}
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Back to shipment
          </Link>
        </p>
      </div>
    );
  }

  return <PublicContainerReport shipmentId={shipmentId} initial={data} operatorPreview />;
}
