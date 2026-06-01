"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shouldShowMockJourneyPanel } from "@/components/MockJourneySimulator";
import { useMockJourneyModal } from "@/contexts/mock-journey-modal";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useSessionAvatar } from "@/contexts/session-avatar";
import { useNewShipmentModal } from "@/components/NewShipmentModal";
import { useOrgAlerts } from "@/hooks/queries/useAlert";
import { useShipmentWorkspaceRowQuery } from "@/hooks/queries/useShipment";
import { signOutBrowser } from "@/services/auth.service";
import { fetchShipment } from "@/services/shipment.service";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import {
  activeNavSegmentFromPathname,
  fallbackSubTabLabel,
  hubShipmentOrderBreadcrumbLabel,
  parseSubTabRoute,
} from "../TopNavBreadcrumb/utils";
import { CUSTOMER_PORTAL_BREADCRUMB_LABEL } from "../TopNavBreadcrumb/constants";
import type { BreadcrumbSegment } from "../TopNavBreadcrumb/types";
import { AUTHENTICATED_TOP_NAV_ORG_HREF } from "./constants";
import { initialsFromEmail, profileMenuLabels } from "./utils";

export function useAuthenticatedTopNav({
  email,
  fullName,
}: {
  email: string;
  fullName?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { openNewShipmentModal, openBulkImportModal } = useNewShipmentModal();
  const { openMockJourneyModal } = useMockJourneyModal();
  const showMockJourney = shouldShowMockJourneyPanel();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const { profileImagePath } = useSessionAvatar();
  const avatarUrl = getProfileImagePublicUrlBrowser(profileImagePath);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const alerts = useOrgAlerts(selectedOrgId);

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

  const hubShipmentQuery = useQuery({
    queryKey: ["top-nav-shipment-hub", hubShipmentId],
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
      return (
        row?.order_number?.trim() ||
        row?.container_number?.trim() ||
        fallbackSubTabLabel(subTabRoute.shipmentId)
      );
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
    if (payload?.viewer === "operator") {
      return `/shipments/${subTabRoute.shipmentId}`;
    }
    return null;
  }, [isHubRoute, subTabRoute, hubShipmentQuery.data]);

  const hubLeafLabel = isHubRoute ? CUSTOMER_PORTAL_BREADCRUMB_LABEL : null;

  const initials = initialsFromEmail(email);
  const { primary: accountPrimaryLabel, secondary: accountSecondaryLabel } = useMemo(
    () => profileMenuLabels(fullName, email),
    [email, fullName],
  );

  useEffect(() => {
    if (!accountMenuOpen && !notificationsMenuOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (accountMenuRef.current?.contains(target)) return;
      if (notificationsMenuRef.current?.contains(target)) return;
      setAccountMenuOpen(false);
      setNotificationsMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [accountMenuOpen, notificationsMenuOpen]);

  const logout = useCallback(async () => {
    setAccountMenuOpen(false);
    setNotificationsMenuOpen(false);
    await signOutBrowser();
    router.push("/login");
    router.refresh();
  }, [router]);

  const toggleAccountMenu = useCallback(() => {
    setNotificationsMenuOpen(false);
    setAccountMenuOpen((value) => !value);
  }, []);

  const toggleNotificationsMenu = useCallback(() => {
    setAccountMenuOpen(false);
    setNotificationsMenuOpen((value) => !value);
  }, []);

  const closeNotificationsMenu = useCallback(() => {
    setNotificationsMenuOpen(false);
  }, []);

  return {
    accountMenuOpen,
    accountMenuRef,
    notificationsMenuOpen,
    notificationsMenuRef,
    selectedOrgId,
    alerts,
    unackedCount,
    orgSegment,
    tabSegment,
    activeSubTabName,
    hubSubTabLabel,
    hubSubTabHref,
    hubLeafLabel,
    initials,
    avatarUrl,
    accountPrimaryLabel,
    accountSecondaryLabel,
    showMockJourney,
    openNewShipmentModal,
    openBulkImportModal,
    openMockJourneyModal,
    toggleAccountMenu,
    toggleNotificationsMenu,
    closeNotificationsMenu,
    logout,
  };
}
