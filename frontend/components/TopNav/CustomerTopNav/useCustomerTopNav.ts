"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBrowserAuthSession, subscribeToAuthState } from "@/services/auth.service";
import { getShipment } from "@/services/shipment.service";
import { shipmentPortalQueryKey } from "@/hooks/queries/useShipment";
import { hubShipmentOrderBreadcrumbLabel, parseSubTabRoute } from "../TopNavBreadcrumb/utils";
import { CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH } from "./constants";
import { customerActiveNavSegment } from "./utils";

export function useCustomerTopNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getBrowserAuthSession();
      if (cancelled) return;
      setSignedIn(Boolean(session));
      setUserId(session?.user.id ?? null);
      setSessionReady(true);
    })();
    // React to an in-page sign-in (portal access gate) without a full reload, so the nav
    // flips from "Sign in" to the account menu the moment the session lands.
    const unsubscribe = subscribeToAuthState((nextSignedIn, session) => {
      setSignedIn(nextSignedIn);
      setUserId(session?.user.id ?? null);
      setSessionReady(true);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const brandHref = signedIn ? CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH : "/";

  const subTabRoute = useMemo(() => parseSubTabRoute(pathname), [pathname]);
  const hubShipmentId = subTabRoute?.kind === "shipment-hub" ? subTabRoute.shipmentId : "";

  // Resolve the shipment order number for the hub breadcrumb (independent of any org workspace).
  const hubShipmentQuery = useQuery({
    queryKey: shipmentPortalQueryKey(hubShipmentId),
    queryFn: () => getShipment(hubShipmentId),
    enabled: Boolean(hubShipmentId),
  });

  const tabSegment = useMemo(() => customerActiveNavSegment(pathname), [pathname]);

  const subTabLabel = useMemo(() => {
    if (!hubShipmentId) return null;
    const payload = hubShipmentQuery.data?.ok ? hubShipmentQuery.data.data : null;
    return hubShipmentOrderBreadcrumbLabel(payload, hubShipmentId);
  }, [hubShipmentId, hubShipmentQuery.data]);

  const breadcrumb = useMemo(
    () => ({
      org: null,
      tab: tabSegment,
      subTabLabel,
      subTabHref: null,
      leafLabel: null,
    }),
    [tabSegment, subTabLabel],
  );

  const hasBreadcrumbs = signedIn && Boolean(tabSegment || subTabLabel);

  return {
    signedIn,
    sessionReady,
    userId,
    brandHref,
    breadcrumb,
    hasBreadcrumbs,
  };
}
