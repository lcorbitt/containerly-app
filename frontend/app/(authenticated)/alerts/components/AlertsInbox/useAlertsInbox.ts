"use client";

import { useMemo, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { usePendingAccessRequestsQuery } from "@/hooks/queries/useOrganization";
import { buildAlertListItems } from "@/app/(authenticated)/dashboard/components/DashboardAlertsPanel/utils";
import { useTrackingDashboard } from "@/app/(authenticated)/dashboard/components/TrackingDashboard/useTrackingDashboard";
import type { AlertsInboxFilter } from "./constants";
import { ALERTS_INBOX_FILTERS } from "./constants";

export function useAlertsInbox() {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const { loading, snapshot, triageBuckets } = useTrackingDashboard();
  const accessRequestsQuery = usePendingAccessRequestsQuery(selectedOrgId);
  const [filter, setFilter] = useState<AlertsInboxFilter>("all");

  const isFreight =
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null);

  const allItems = useMemo(
    () =>
      buildAlertListItems(
        triageBuckets,
        snapshot?.triageActionContextByContainerId ?? {},
      ),
    [triageBuckets, snapshot?.triageActionContextByContainerId],
  );

  const filterCounts = useMemo(() => {
    const counts: Record<AlertsInboxFilter, number> = {
      all: allItems.length,
      exceptions: 0,
      eta: 0,
      docs: 0,
      customer: 0,
    };
    for (const item of allItems) {
      counts[item.bucketKey] += 1;
    }
    return counts;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return allItems;
    return allItems.filter((item) => item.bucketKey === filter);
  }, [allItems, filter]);

  const accessRequests = useMemo(() => {
    if (filter !== "all" && filter !== "customer") return [];
    return accessRequestsQuery.data ?? [];
  }, [accessRequestsQuery.data, filter]);

  return {
    loading: loading || accessRequestsQuery.isLoading,
    filter,
    setFilter,
    filteredItems,
    accessRequests,
    filterCounts,
    isFreight,
    selectedOrgId,
    filterOptions: ALERTS_INBOX_FILTERS,
  };
}
