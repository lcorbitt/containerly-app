"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePostgresRealtimeInvalidation } from "@/hooks/usePostgresRealtimeInvalidation";
import { orgMessageThreadsQueryKeyRoot } from "@/hooks/queries/useOrgMessageThreads";
import { orgAlertsQueryKeyRoot } from "@/hooks/queries/useAlert";

/** Partial key: invalidates every `["shipment-scope-thread", organizationId, …]` query. */
export const shipmentScopeThreadOrgQueryKeyPrefix = "shipment-scope-thread" as const;

export function orgReportMessagesRealtimeDedupeKey(organizationId: string): string {
  return `report_messages:org:${organizationId}`;
}

export function invalidateOrgReportMessageQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...orgMessageThreadsQueryKeyRoot, organizationId],
  });
  void queryClient.invalidateQueries({
    queryKey: [shipmentScopeThreadOrgQueryKeyPrefix, organizationId],
  });
  void queryClient.invalidateQueries({
    queryKey: [...orgAlertsQueryKeyRoot, organizationId],
  });
}

/** One Realtime channel per org for `report_messages`; refetches side nav + shipment threads. */
export function useOrgReportMessagesRealtimeInvalidation(organizationId: string | null): void {
  const qc = useQueryClient();

  const onEvent = useCallback(() => {
    if (!organizationId) return;
    invalidateOrgReportMessageQueries(qc, organizationId);
  }, [organizationId, qc]);

  usePostgresRealtimeInvalidation({
    enabled: Boolean(organizationId),
    dedupeKey: organizationId ? orgReportMessagesRealtimeDedupeKey(organizationId) : "",
    table: "report_messages",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    onEvent,
  });
}
