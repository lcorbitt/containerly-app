"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useOrgMessageThreads } from "@/hooks/queries/useShipmentMessageThreads";
import { useTrackingDashboardQuery } from "@/hooks/queries/useTracking";
import { buildTriageBucketsFromProps } from "@/app/(authenticated)/dashboard/components/DashboardTriage";
import { toolsNavGroup } from "../constants";
import { isSideNavLinkActive } from "../utils";

export type SideNavSecondaryPanel = "messages";

export function useSideNav(isSuperAdmin: boolean) {
  const pathname = usePathname();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const [secondaryPanelPath, setSecondaryPanelPath] = useState<{
    pathname: string;
    panel: SideNavSecondaryPanel;
  } | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(() =>
    toolsNavGroup.items.some((item) => isSideNavLinkActive(pathname, item.href)),
  );
  const messageThreads = useOrgMessageThreads(selectedOrgId);
  const dashboardQuery = useTrackingDashboardQuery(selectedOrgId);

  const unreadCount = useMemo(
    () => messageThreads.filter((thread) => thread.is_unread).length,
    [messageThreads],
  );

  const alertsCount = useMemo(() => {
    const snap = dashboardQuery.data;
    if (!snap?.currentUserId) return 0;
    const buckets = buildTriageBucketsFromProps({
      userId: snap.currentUserId,
      requests: snap.requests,
      alerts: snap.alerts,
      containersById: snap.triageContainersById,
      shipmentOwnerByShipmentId: snap.shipmentOwnerByShipmentId,
      shipmentAssigneeByShipmentId: snap.shipmentAssigneeByShipmentId,
      attachmentCountByRequestId: snap.triageAttachmentCounts,
      messages: snap.triageMessages,
      participatingShipmentIds: new Set(snap.participatingShipmentIds),
    });
    return buckets.reduce((total, bucket) => total + bucket.rows.length, 0);
  }, [dashboardQuery.data]);

  const messagesOpen =
    secondaryPanelPath?.pathname === pathname && secondaryPanelPath.panel === "messages";

  const isFreight =
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null);

  const toggleMessages = () => {
    setSecondaryPanelPath((current) =>
      current?.pathname === pathname && current.panel === "messages"
        ? null
        : { pathname, panel: "messages" },
    );
  };

  const toggleTools = () => setToolsExpanded((open) => !open);

  const closeSecondaryPanel = () => setSecondaryPanelPath(null);

  return {
    pathname,
    selectedOrgId,
    messagesOpen,
    messageThreads,
    unreadCount,
    alertsCount,
    isFreight,
    toolsExpanded,
    toggleMessages,
    toggleTools,
    closeSecondaryPanel,
  };
}
