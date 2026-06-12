"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { useOrgMessageThreads } from "@/hooks/queries/useShipmentMessageThreads";
import {
  trackingDashboardQueryKeyRoot,
  useTrackingDashboardSnapshotCache,
  useWorkspaceSummaryQuery,
  workspaceSummaryQueryKeyRoot,
} from "@/hooks/queries/useTracking";
import { TRACKING_CREATED_EVENT } from "@/utils/tracking-created-event";
import { buildTriageBucketsFromProps } from "@/app/(authenticated)/dashboard/components/DashboardTriage";
import { toolsNavGroup } from "../constants";
import { isSideNavLinkActive } from "../utils";

export type SideNavSecondaryPanel = "messages";

function pathnameUsesTriageSnapshot(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/alerts" ||
    pathname === "/reports"
  );
}

export function useSideNav(isSuperAdmin: boolean) {
  const pathname = usePathname();
  const qc = useQueryClient();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const [secondaryPanelPath, setSecondaryPanelPath] = useState<{
    pathname: string;
    panel: SideNavSecondaryPanel;
  } | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(() =>
    toolsNavGroup.items.some((item) => isSideNavLinkActive(pathname, item.href)),
  );
  const messageThreads = useOrgMessageThreads(selectedOrgId);
  const { data: cachedTriageSnapshot } = useTrackingDashboardSnapshotCache(selectedOrgId);

  const shouldFetchWorkspaceSummary =
    Boolean(selectedOrgId) && !pathnameUsesTriageSnapshot(pathname);
  const workspaceSummaryQuery = useWorkspaceSummaryQuery(selectedOrgId, shouldFetchWorkspaceSummary);

  useEffect(() => {
    const onCreated = () => {
      void qc.invalidateQueries({ queryKey: workspaceSummaryQueryKeyRoot });
      void qc.invalidateQueries({ queryKey: trackingDashboardQueryKeyRoot });
    };
    window.addEventListener(TRACKING_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(TRACKING_CREATED_EVENT, onCreated);
  }, [qc]);

  const unreadCount = useMemo(
    () => messageThreads.filter((thread) => thread.is_unread).length,
    [messageThreads],
  );

  const alertsCount = useMemo(() => {
    const snap = cachedTriageSnapshot;
    if (snap?.currentUserId) {
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
    }
    return workspaceSummaryQuery.data?.personalTriageCount ?? 0;
  }, [cachedTriageSnapshot, workspaceSummaryQuery.data]);

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
