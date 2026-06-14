"use client";

import { useOrgAlertsRealtimeInvalidation } from "@/hooks/queries/useAlerts";
import { useOrgShipmentMessagesRealtimeInvalidation } from "@/hooks/queries/useShipmentMessageThreads";

/**
 * Org-scoped Supabase Realtime (WebSocket postgres_changes) for workspace chrome:
 * - `alerts` → top-nav notification list
 * - `shipment_messages` → side-nav message threads (+ open shipment threads)
 *
 * Mount once in authenticated shell; TanStack Query still fetches on mount as fallback.
 */
export function useOrgWorkspaceRealtime(organizationId: string | null): void {
  useOrgAlertsRealtimeInvalidation(organizationId);
  useOrgShipmentMessagesRealtimeInvalidation(organizationId);
}
