"use client";

import { useQuery } from "@tanstack/react-query";
import { useMyAlertsRealtimeInvalidation } from "@/hooks/queries/useMyAlertsRealtime";
import { fetchMyAlertsPage } from "@/services/alert.service";

const DEFAULT_MY_ALERTS_LIMIT = 50;

export const myAlertsQueryKeyRoot = ["my-alerts"] as const;

function myAlertsQueryKey(userId: string, limit: number) {
  return [...myAlertsQueryKeyRoot, userId, limit] as const;
}

/** Customer-scoped notification inbox: alerts personally addressed to the signed-in user. */
export function useMyAlertsQuery(userId: string | null) {
  useMyAlertsRealtimeInvalidation(userId);

  return useQuery({
    queryKey: userId
      ? myAlertsQueryKey(userId, DEFAULT_MY_ALERTS_LIMIT)
      : [...myAlertsQueryKeyRoot, "disabled", null],
    queryFn: () => fetchMyAlertsPage(DEFAULT_MY_ALERTS_LIMIT),
    enabled: Boolean(userId),
  });
}

export function useMyAlerts(userId: string | null) {
  const q = useMyAlertsQuery(userId);
  return q.data ?? [];
}
