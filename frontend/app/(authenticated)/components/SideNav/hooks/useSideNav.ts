"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useOrgAlerts } from "@/hooks/queries/useAlert";
import { freightNavItems, importerNavItems } from "../constants";

export function useSideNav(isSuperAdmin: boolean) {
  const pathname = usePathname();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const alerts = useOrgAlerts(selectedOrgId);

  const unackedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged_at).length,
    [alerts],
  );

  useEffect(() => {
    setNotificationsOpen(false);
  }, [pathname]);

  const isFreight =
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null);

  const mainNavItems = isFreight ? freightNavItems : importerNavItems;

  const toggleNotifications = () => setNotificationsOpen((o) => !o);
  const closeNotifications = () => setNotificationsOpen(false);

  return {
    pathname,
    selectedOrgId,
    notificationsOpen,
    alerts,
    unackedCount,
    mainNavItems,
    toggleNotifications,
    closeNotifications,
  };
}
