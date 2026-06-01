"use client";

import { useEffect, useRef } from "react";
import {
  acquirePostgresChangesSubscription,
  type PostgresChangesSubscriptionConfig,
} from "@/lib/supabase/postgres-realtime";

interface UsePostgresRealtimeInvalidationInput extends PostgresChangesSubscriptionConfig {
  enabled: boolean;
  /** Stable key so multiple hooks share one Realtime channel. */
  dedupeKey: string;
  onEvent: () => void;
}

/** Subscribes to Postgres changes and calls `onEvent` (typically TanStack Query invalidation). */
export function usePostgresRealtimeInvalidation(input: UsePostgresRealtimeInvalidationInput): void {
  const onEventRef = useRef(input.onEvent);
  onEventRef.current = input.onEvent;

  const { enabled, dedupeKey, table, schema, event, filter } = input;

  useEffect(() => {
    if (!enabled || !dedupeKey) return;

    return acquirePostgresChangesSubscription(
      dedupeKey,
      { table, schema, event, filter },
      () => {
        onEventRef.current();
      },
    );
  }, [enabled, dedupeKey, table, schema, event, filter]);
}
