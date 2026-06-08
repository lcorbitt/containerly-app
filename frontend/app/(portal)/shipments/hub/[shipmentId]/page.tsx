"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PublicContainerReport } from "@/components/PublicContainerReport";
import { PageLoading } from "@/components/PageLoading";
import { fetchShipment } from "@/services/shipment.service";
import { getBrowserAuthSession } from "@/services/auth.service";
import type { PublicReportPayload } from "@/types/public-report";
import { CUSTOMER_MY_SHIPMENTS_LABEL, CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH } from "@/components/TopNav/CustomerTopNav/constants";
import { CustomerPortalShareMenu } from "./components/CustomerPortalShareMenu";
import { PortalAccessGate } from "./components/PortalAccessGate";

type HubPhase = "loading" | "gate" | "portal" | "denied";

export default function SharedShipmentTrackingPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = use(params);
  const [phase, setPhase] = useState<HubPhase>("loading");
  const [data, setData] = useState<PublicReportPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const inviteToken = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
    if (inviteToken) {
      window.location.replace(`/invite/accept?token=${encodeURIComponent(inviteToken)}`);
      return;
    }

    let cancelled = false;
    (async () => {
      setPhase("loading");
      setErr(null);
      setData(null);

      const session = await getBrowserAuthSession();
      if (cancelled) return;

      if (!session) {
        setPhase("gate");
        return;
      }

      const r = await fetchShipment(shipmentId);
      if (cancelled) return;

      if (r.ok) {
        setData(r.data);
        setPhase("portal");
        return;
      }

      if (r.status === 401) {
        setPhase("gate");
        return;
      }

      if (r.status === 403) {
        setPhase("denied");
        setErr(r.error);
        return;
      }

      setPhase("denied");
      setErr(r.error);
    })();

    return () => {
      cancelled = true;
    };
  }, [shipmentId, reloadKey]);

  if (phase === "loading") {
    return <PageLoading loadingText="Loading Customer Portal…" />;
  }

  if (phase === "gate") {
    return (
      <PortalAccessGate shipmentId={shipmentId} onSignedIn={() => setReloadKey((k) => k + 1)} />
    );
  }

  if (phase === "denied") {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <PortalAccessGate
          shipmentId={shipmentId}
          showSignedInHint
          onSignedIn={() => setReloadKey((k) => k + 1)}
        />
        {err ? (
          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">{err}</p>
        ) : null}
        <p className="mt-6 text-center">
          <Link
            href={CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH}
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Back to {CUSTOMER_MY_SHIPMENTS_LABEL}
          </Link>
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Could not load this portal.</p>
      </div>
    );
  }

  return (
    <PublicContainerReport
      shipmentId={shipmentId}
      initial={data}
      headerActions={
        data.viewer === "org_member" && data.organization?.id ? (
          <CustomerPortalShareMenu shipmentId={shipmentId} organizationId={data.organization.id} />
        ) : undefined
      }
    />
  );
}
