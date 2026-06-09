"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePostgresRealtimeInvalidation } from "@/hooks/usePostgresRealtimeInvalidation";
import { orgAlertsQueryKeyRoot } from "@/hooks/queries/useAlerts";
import {
  fetchImporterShipmentMessageThreads,
  fetchOrgShipmentMessageThreads,
} from "@/services/workspace.service";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";

export const orgMessageThreadsQueryKeyRoot = ["org-message-threads"] as const;
export const importerMessageThreadsQueryKeyRoot = ["importer-message-threads"] as const;

/** Partial key: invalidates every `["shipment-scope-thread", organizationId, …]` query. */
export const shipmentScopeThreadOrgQueryKeyPrefix = "shipment-scope-thread" as const;

function orgMessageThreadsQueryKey(organizationId: string) {
  return [...orgMessageThreadsQueryKeyRoot, organizationId] as const;
}

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

export function useOrgMessageThreadsQuery(organizationId: string | null) {
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

export function useImporterMessageThreadsQuery() {
  return useQuery({
    queryKey: importerMessageThreadsQueryKeyRoot,
    queryFn: async () => {
      const result = await fetchImporterShipmentMessageThreads();
      if (!result.ok) throw new Error(result.error);
      return result.threads;
    },
  });
}

export function useImporterMessageThreads(): ShipmentMessageThreadSummary[] {
  const q = useImporterMessageThreadsQuery();
  return q.data ?? [];
}
