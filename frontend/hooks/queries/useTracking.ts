import { useQuery } from "@tanstack/react-query";
import {
  fetchTrackingDashboardSnapshot,
  loadOperatorTrackingRequestsPageBrowser,
} from "@/services/tracking.service";
import type {
  OperatorRequestScope,
  OperatorRequestSortColumn,
  SortDirection,
} from "@/utils/operator-tracking-requests";

export const trackingDashboardQueryKeyRoot = ["tracking-dashboard"] as const;
export const operatorContainersQueryKeyRoot = ["operator-containers"] as const;

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
