"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useNewShipmentModal } from "@/components/NewShipmentModal";
import { useAcknowledgeAllOrgAlertsMutation } from "@/hooks/mutations/useAlerts";
import { useMarkShipmentThreadReadMutation } from "@/hooks/mutations/useShipmentMessageThreads";
import { useOrgAlerts } from "@/hooks/queries/useAlerts";
import { isMessageShipmentAlert } from "@/utils/alert-inbox";
import { useShipmentWorkspaceRowQuery } from "@/hooks/queries/useShipment";
import { fetchShipment } from "@/services/shipment.service";
import {
  activeNavSegmentFromPathname,
  fallbackSubTabLabel,
  hubShipmentOrderBreadcrumbLabel,
  parseSubTabRoute,
} from "../TopNavBreadcrumb/utils";
import { CUSTOMER_PORTAL_BREADCRUMB_LABEL } from "../TopNavBreadcrumb/constants";
import type { BreadcrumbSegment } from "../TopNavBreadcrumb/types";
import { AUTHENTICATED_TOP_NAV_ORG_HREF } from "./constants";

export function useAuthenticatedTopNav() {
  const pathname = usePathname();
  const { openNewShipmentModal, openBulkImportModal } = useNewShipmentModal();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const alerts = useOrgAlerts(selectedOrgId);
  const acknowledgeAllMut = useAcknowledgeAllOrgAlertsMutation(selectedOrgId);
  const markThreadReadMut = useMarkShipmentThreadReadMutation(selectedOrgId);
  const ackedOnOpenRef = useRef(false);

  const unackedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged_at).length,
    [alerts],
  );

  const isFreight =
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null);

  const subTabRoute = useMemo(() => parseSubTabRoute(pathname), [pathname]);

  const operatorShipmentId =
    subTabRoute?.kind === "shipment-operator" ? subTabRoute.shipmentId : "";
  const hubShipmentId = subTabRoute?.kind === "shipment-hub" ? subTabRoute.shipmentId : "";

  const workspaceRowQuery = useShipmentWorkspaceRowQuery({
    shipmentId: operatorShipmentId,
    organizationId: selectedOrgId,
  });

  // Hub breadcrumbs read the order number from the get-shipment payload
  // (independent of the selected org), so it resolves reliably.
  const hubShipmentQuery = useQuery({
    queryKey: ["top-nav-shipment-portal", hubShipmentId],
    queryFn: () => fetchShipment(hubShipmentId),
    enabled: Boolean(hubShipmentId),
  });

  const orgSegment = useMemo((): BreadcrumbSegment | null => {
    if (hubShipmentId && hubShipmentQuery.data?.ok) {
      const portalOrgName = hubShipmentQuery.data.data.organization?.name?.trim();
      if (portalOrgName) {
        return { label: portalOrgName, href: AUTHENTICATED_TOP_NAV_ORG_HREF };
      }
    }

    const selected = orgs.find((r) => r.organizations?.id === selectedOrgId);
    const name = selected?.organizations?.name?.trim();
    if (!name) return null;
    return { label: name, href: AUTHENTICATED_TOP_NAV_ORG_HREF };
  }, [orgs, selectedOrgId, hubShipmentId, hubShipmentQuery.data]);

  const tabSegment = useMemo(
    () => activeNavSegmentFromPathname(pathname, isFreight),
    [pathname, isFreight],
  );

  const isHubRoute = subTabRoute?.kind === "shipment-hub";

  const activeSubTabName = useMemo(() => {
    if (!subTabRoute || isHubRoute) return null;

    if (subTabRoute.kind === "shipment-operator") {
      const row = workspaceRowQuery.data?.ok ? workspaceRowQuery.data.row : null;
      const orderNumber = row?.order_number?.trim();
      if (orderNumber) return `Order No. ${orderNumber}`;
      return row?.container_number?.trim() || fallbackSubTabLabel(subTabRoute.shipmentId);
    }

    if (subTabRoute.kind === "container") {
      return fallbackSubTabLabel(subTabRoute.containerId);
    }

    return null;
  }, [subTabRoute, isHubRoute, workspaceRowQuery.data]);

  const hubSubTabLabel = useMemo(() => {
    if (!isHubRoute || !subTabRoute || subTabRoute.kind !== "shipment-hub") return null;
    const payload = hubShipmentQuery.data?.ok ? hubShipmentQuery.data.data : null;
    return hubShipmentOrderBreadcrumbLabel(payload, subTabRoute.shipmentId);
  }, [isHubRoute, subTabRoute, hubShipmentQuery.data]);

  const hubSubTabHref = useMemo(() => {
    if (!isHubRoute || !subTabRoute || subTabRoute.kind !== "shipment-hub") return null;
    const payload = hubShipmentQuery.data?.ok ? hubShipmentQuery.data.data : null;
    if (payload?.viewer === "org_member") {
      return `/shipments/${subTabRoute.shipmentId}`;
    }
    return null;
  }, [isHubRoute, subTabRoute, hubShipmentQuery.data]);

  const hubLeafLabel = isHubRoute ? CUSTOMER_PORTAL_BREADCRUMB_LABEL : null;

  useEffect(() => {
    if (!notificationsMenuOpen) {
      ackedOnOpenRef.current = false;
      return;
    }
    if (ackedOnOpenRef.current || unackedCount === 0 || !selectedOrgId) return;
    ackedOnOpenRef.current = true;

    const messageShipmentIds = [
      ...new Set(
        alerts
          .filter((a) => !a.acknowledged_at && isMessageShipmentAlert(a) && a.shipment_id)
          .map((a) => a.shipment_id as string),
      ),
    ];

    for (const shipmentId of messageShipmentIds) {
      markThreadReadMut.mutate({ shipmentId });
    }
    acknowledgeAllMut.mutate();
  }, [notificationsMenuOpen, unackedCount, selectedOrgId, alerts]);

  useEffect(() => {
    if (!notificationsMenuOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (notificationsMenuRef.current?.contains(target)) return;
      setNotificationsMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [notificationsMenuOpen]);

  const toggleNotificationsMenu = useCallback(() => {
    setNotificationsMenuOpen((value) => !value);
  }, []);

  const closeNotificationsMenu = useCallback(() => {
    setNotificationsMenuOpen(false);
  }, []);

  return {
    notificationsMenuOpen,
    notificationsMenuRef,
    selectedOrgId,
    alerts,
    unackedCount,
    isFreight,
    orgSegment,
    tabSegment,
    activeSubTabName,
    hubSubTabLabel,
    hubSubTabHref,
    hubLeafLabel,
    openNewShipmentModal,
    openBulkImportModal,
    toggleNotificationsMenu,
    closeNotificationsMenu,
  };
}
