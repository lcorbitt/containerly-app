"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePostgresRealtimeInvalidation } from "@/hooks/usePostgresRealtimeInvalidation";
import { orgAlertsQueryKeyRoot } from "@/hooks/queries/useAlert";
import { orgAlertsRealtimeDedupeKey } from "@/services/alert.service";

export function invalidateOrgAlertsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...orgAlertsQueryKeyRoot, organizationId],
  });
}

/** Realtime on `alerts` → refetch top-nav notification list (INSERT/UPDATE/DELETE). */
export function useOrgAlertsRealtimeInvalidation(organizationId: string | null): void {
  const qc = useQueryClient();

  const onEvent = useCallback(() => {
    if (!organizationId) return;
    invalidateOrgAlertsQueries(qc, organizationId);
  }, [organizationId, qc]);

  usePostgresRealtimeInvalidation({
    enabled: Boolean(organizationId),
    dedupeKey: organizationId ? orgAlertsRealtimeDedupeKey(organizationId) : "",
    table: "alerts",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    onEvent,
  });
}
