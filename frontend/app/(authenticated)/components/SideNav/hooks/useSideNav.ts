"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useOrgAlerts } from "@/hooks/queries/useAlert";
import { freightNavItems, importerNavItems } from "../constants";

export function useSideNav(isSuperAdmin: boolean) {
  const pathname = usePathname();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const [notificationsOpenPath, setNotificationsOpenPath] = useState<string | null>(null);
  const alerts = useOrgAlerts(selectedOrgId);

  const unackedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged_at).length,
    [alerts],
  );

  const notificationsOpen = notificationsOpenPath === pathname;

  const isFreight =
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null);

  const mainNavItems = isFreight ? freightNavItems : importerNavItems;

  const toggleNotifications = () =>
    setNotificationsOpenPath((openPath) => (openPath === pathname ? null : pathname));
  const closeNotifications = () => setNotificationsOpenPath(null);

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
