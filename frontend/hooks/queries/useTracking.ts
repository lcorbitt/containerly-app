import { useQuery } from "@tanstack/react-query";
import {
  fetchTrackingDashboardAnalytics,
  fetchTrackingDashboardSnapshot,
  fetchWorkspaceSummary,
  loadOperatorTrackingRequestsPageBrowser,
  type TrackingDashboardAnalyticsScope,
} from "@/services/tracking.service";
import type {
  TrackingDashboardInsightsBundle,
  TrackingDashboardReportsBundle,
} from "@/types/tracking-dashboard-analytics";
import type {
  OperatorRequestScope,
  OperatorRequestSortColumn,
  SortDirection,
} from "@/utils/operator-tracking-requests";

export const trackingDashboardQueryKeyRoot = ["tracking-dashboard"] as const;
export const trackingDashboardInsightsQueryKeyRoot = ["tracking-dashboard-insights"] as const;
export const trackingDashboardReportsQueryKeyRoot = ["tracking-dashboard-reports"] as const;
export const workspaceSummaryQueryKeyRoot = ["workspace-summary"] as const;
export const operatorContainersQueryKeyRoot = ["operator-containers"] as const;

const WORKSPACE_SUMMARY_STALE_MS = 5 * 60_000;

export function useTrackingDashboardQuery(organizationId: string | null) {
  return useQuery({
    queryKey: [...trackingDashboardQueryKeyRoot, organizationId],
    queryFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchTrackingDashboardSnapshot(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

export function useTrackingDashboardInsightsQuery(
  organizationId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [...trackingDashboardInsightsQueryKeyRoot, organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchTrackingDashboardAnalytics(
        organizationId,
        "insights",
      ) as Promise<TrackingDashboardInsightsBundle>;
    },
    enabled: Boolean(organizationId) && enabled,
  });
}

export function useTrackingDashboardReportsQuery(
  organizationId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [...trackingDashboardReportsQueryKeyRoot, organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchTrackingDashboardAnalytics(
        organizationId,
        "reports",
      ) as Promise<TrackingDashboardReportsBundle>;
    },
    enabled: Boolean(organizationId) && enabled,
  });
}

export function useWorkspaceSummaryQuery(organizationId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...workspaceSummaryQueryKeyRoot, organizationId],
    queryFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchWorkspaceSummary(organizationId);
    },
    enabled: Boolean(organizationId) && enabled,
    staleTime: WORKSPACE_SUMMARY_STALE_MS,
  });
}

export function useOperatorContainersQuery(input: {
  organizationId: string | null;
  scope: OperatorRequestScope;
  search: string;
  page: number;
  pageSize: number;
  sortColumn: OperatorRequestSortColumn;
  sortDirection: SortDirection;
}) {
  return useQuery({
    queryKey: [
      ...operatorContainersQueryKeyRoot,
      input.organizationId,
      input.scope,
      input.search,
      input.page,
      input.pageSize,
      input.sortColumn,
      input.sortDirection,
    ],
    queryFn: async () => {
      if (!input.organizationId) throw new Error("organizationId required");
      return loadOperatorTrackingRequestsPageBrowser({
        organizationId: input.organizationId,
        scope: input.scope,
        page: input.page,
        pageSize: input.pageSize,
        sortColumn: input.sortColumn,
        sortDirection: input.sortDirection,
        search: input.search,
      });
    },
    enabled: Boolean(input.organizationId),
  });
}

export type { TrackingDashboardAnalyticsScope };
