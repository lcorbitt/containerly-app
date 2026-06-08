"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePostgresRealtimeInvalidation } from "@/hooks/usePostgresRealtimeInvalidation";
import { myAlertsQueryKeyRoot } from "@/hooks/queries/useMyAlerts";
import { myAlertsRealtimeDedupeKey } from "@/services/alert.service";

export function invalidateMyAlertsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...myAlertsQueryKeyRoot, userId],
  });
}

/** Realtime on `alerts` filtered to the signed-in user → refetch the customer notification list. */
export function useMyAlertsRealtimeInvalidation(userId: string | null): void {
  const qc = useQueryClient();

  const onEvent = useCallback(() => {
    if (!userId) return;
    invalidateMyAlertsQueries(qc, userId);
  }, [userId, qc]);

  usePostgresRealtimeInvalidation({
    enabled: Boolean(userId),
    dedupeKey: userId ? myAlertsRealtimeDedupeKey(userId) : "",
    table: "alerts",
    filter: userId ? `recipient_user_id=eq.${userId}` : undefined,
    onEvent,
  });
}
