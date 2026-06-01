"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { PublicContainerReport } from "@/components/PublicContainerReport";
import { PageLoading } from "@/components/PageLoading";
import { fetchShipment } from "@/services/shipment.service";
import type { PublicReportPayload } from "@/types/public-report";
import { CustomerPortalShareMenu } from "./components/CustomerPortalShareMenu";

export default function SharedShipmentTrackingPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<PublicReportPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const r = await fetchShipment(shipmentId);
      if (cancelled) return;
      if (r.ok) {
        setData(r.data);
        setErr(null);
        setLoading(false);
        return;
      }
      setData(null);
      if (r.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/shipments/hub/${shipmentId}`)}`);
        setLoading(false);
        return;
      }
      if (!cancelled) {
        setErr(
          r.status === 403
            ? "You don't have access to this shipment. Sign in with an invited customer email, or ask to be added as assignee or participant."
            : r.error,
        );
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shipmentId, router]);

  if (loading) {
    return <PageLoading loadingText="Loading Customer Portal…" />;
  }

  if (err || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Shared tracking unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{err ?? "Unknown error"}</p>
        <Link
          href="/shipments"
          className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Back to Shared with me
        </Link>
      </div>
    );
  }

  return (
    <PublicContainerReport
      shipmentId={shipmentId}
      initial={data}
      headerActions={
        data.viewer === "org_member" ? <CustomerPortalShareMenu shipmentId={shipmentId} /> : undefined
      }
    />
  );
}
