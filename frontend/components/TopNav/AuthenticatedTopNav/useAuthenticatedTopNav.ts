"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shouldShowMockJourneyPanel } from "@/components/MockJourneySimulator";
import { useMockJourneyModal } from "@/contexts/mock-journey-modal";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useSessionAvatar } from "@/contexts/session-avatar";
import { useNewShipmentModal } from "@/components/NewShipmentModal";
import { useShipmentWorkspaceRowQuery } from "@/hooks/queries/useShipment";
import { signOutBrowser } from "@/services/auth.service";
import { fetchShipment } from "@/services/shipment.service";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import {
  activeNavSegmentFromPathname,
  fallbackSubTabLabel,
  parseSubTabRoute,
} from "../TopNavBreadcrumb/utils";
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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isFreight =
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null);

  const orgSegment = useMemo((): BreadcrumbSegment | null => {
    const selected = orgs.find((r) => r.organizations?.id === selectedOrgId);
    const name = selected?.organizations?.name?.trim();
    if (!name) return null;
    return { label: name, href: AUTHENTICATED_TOP_NAV_ORG_HREF };
  }, [orgs, selectedOrgId]);

  const tabSegment = useMemo(
    () => activeNavSegmentFromPathname(pathname, isFreight),
    [pathname, isFreight],
  );

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

  const activeSubTabName = useMemo(() => {
    if (!subTabRoute) return null;

    if (subTabRoute.kind === "shipment-operator") {
      const row = workspaceRowQuery.data?.ok ? workspaceRowQuery.data.row : null;
      return (
        row?.order_number?.trim() ||
        row?.container_number?.trim() ||
        fallbackSubTabLabel(subTabRoute.shipmentId)
      );
    }

    if (subTabRoute.kind === "shipment-hub") {
      const payload = hubShipmentQuery.data?.ok ? hubShipmentQuery.data.data : null;
      return (
        payload?.summary?.order_number?.trim() ||
        payload?.commercial_details?.lines?.[0]?.order_number?.trim() ||
        fallbackSubTabLabel(subTabRoute.shipmentId)
      );
    }

    if (subTabRoute.kind === "container") {
      return fallbackSubTabLabel(subTabRoute.containerId);
    }

    return null;
  }, [subTabRoute, workspaceRowQuery.data, hubShipmentQuery.data]);

  const initials = initialsFromEmail(email);
  const { primary: accountPrimaryLabel, secondary: accountSecondaryLabel } = useMemo(
    () => profileMenuLabels(fullName, email),
    [email, fullName],
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const logout = useCallback(async () => {
    setOpen(false);
    await signOutBrowser();
    router.push("/login");
    router.refresh();
  }, [router]);

  const toggleMenu = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  return {
    open,
    menuRef,
    orgSegment,
    tabSegment,
    activeSubTabName,
    initials,
    avatarUrl,
    accountPrimaryLabel,
    accountSecondaryLabel,
    showMockJourney,
    openNewShipmentModal,
    openBulkImportModal,
    openMockJourneyModal,
    toggleMenu,
    logout,
  };
}
