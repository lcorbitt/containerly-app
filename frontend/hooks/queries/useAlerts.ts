"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { usePostgresRealtimeInvalidation } from "@/hooks/usePostgresRealtimeInvalidation";
import {
  fetchMyAlertsPage,
  fetchOrgAlertsPage,
  myAlertsRealtimeDedupeKey,
  orgAlertsRealtimeDedupeKey,
} from "@/services/alert.service";
import type { Alert } from "@/types/database";

const DEFAULT_ORG_ALERTS_LIMIT = 50;
const DEFAULT_MY_ALERTS_LIMIT = 50;

export const orgAlertsQueryKeyRoot = ["org-alerts"] as const;
export const myAlertsQueryKeyRoot = ["my-alerts"] as const;

function orgAlertsQueryKey(organizationId: string, limit: number) {
  return [...orgAlertsQueryKeyRoot, organizationId, limit] as const;
}

function myAlertsQueryKey(userId: string, limit: number) {
  return [...myAlertsQueryKeyRoot, userId, limit] as const;
}

type AlertsQuerySnapshot = [queryKey: readonly unknown[], data: Alert[] | undefined];

/** Shared optimistic-update helpers for alerts list queries (org + customer inboxes). */
export function optimisticallyAcknowledgeAllAlerts(
  qc: QueryClient,
  queryKeyPrefix: readonly unknown[],
): { previous: AlertsQuerySnapshot[] } {
  const queryKey = [...queryKeyPrefix];
  void qc.cancelQueries({ queryKey });
  const previous = qc.getQueriesData<Alert[]>({ queryKey });
  const now = new Date().toISOString();
  qc.setQueriesData<Alert[]>({ queryKey }, (old) =>
    old?.map((alert) =>
      alert.acknowledged_at ? alert : { ...alert, acknowledged_at: now },
    ),
  );
  return { previous };
}

export function restoreAlertsQueryCache(
  qc: QueryClient,
  previous: AlertsQuerySnapshot[],
): void {
  for (const [key, data] of previous) {
    qc.setQueryData(key, data);
  }
}

export function invalidateOrgAlertsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...orgAlertsQueryKeyRoot, organizationId],
  });
}

export function invalidateMyAlertsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...myAlertsQueryKeyRoot, userId],
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

export function useOrgAlertsQuery(organizationId: string | null) {
  useOrgAlertsRealtimeInvalidation(organizationId);

  return useQuery({
    queryKey: organizationId
      ? orgAlertsQueryKey(organizationId, DEFAULT_ORG_ALERTS_LIMIT)
      : [...orgAlertsQueryKeyRoot, "disabled", null],
    queryFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchOrgAlertsPage(organizationId, DEFAULT_ORG_ALERTS_LIMIT);
    },
    enabled: Boolean(organizationId),
  });
}

export function useOrgAlerts(organizationId: string | null) {
  const q = useOrgAlertsQuery(organizationId);
  return q.data ?? [];
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
