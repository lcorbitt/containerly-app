"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrgReportMessagesRealtimeInvalidation } from "@/hooks/queries/useOrgReportMessagesRealtime";
import { fetchOrgShipmentMessageThreads } from "@/services/workspace.service";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";

export const orgMessageThreadsQueryKeyRoot = ["org-message-threads"] as const;

function orgMessageThreadsQueryKey(organizationId: string) {
  return [...orgMessageThreadsQueryKeyRoot, organizationId] as const;
}

export function useOrgMessageThreadsQuery(organizationId: string | null) {
  useOrgReportMessagesRealtimeInvalidation(organizationId);

  return useQuery({
    queryKey: organizationId
      ? orgMessageThreadsQueryKey(organizationId)
      : [...orgMessageThreadsQueryKeyRoot, "disabled", null],
    queryFn: async () => {
      if (!organizationId) throw new Error("organizationId required");
      const result = await fetchOrgShipmentMessageThreads(organizationId);
      if (!result.ok) throw new Error(result.error);
      return result.threads;
    },
    enabled: Boolean(organizationId),
  });
}

export function useOrgMessageThreads(organizationId: string | null): ShipmentMessageThreadSummary[] {
  const q = useOrgMessageThreadsQuery(organizationId);
  return q.data ?? [];
}
