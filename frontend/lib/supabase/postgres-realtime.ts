import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface PostgresChangesSubscriptionConfig {
  table: string;
  schema?: string;
  event?: PostgresChangeEvent;
  filter?: string;
}

type PostgresChangeListener = () => void;

interface PostgresChangesPoolEntry {
  supabase: SupabaseClient;
  channel: RealtimeChannel;
  listeners: Set<PostgresChangeListener>;
  refCount: number;
}

const pools = new Map<string, PostgresChangesPoolEntry>();

export type PostgresRealtimeRelease = () => void;

/**
 * Ref-counted Supabase Realtime `postgres_changes` subscription.
 * Multiple React hooks can share one channel per `dedupeKey`.
 */
export function acquirePostgresChangesSubscription(
  dedupeKey: string,
  config: PostgresChangesSubscriptionConfig,
  listener: PostgresChangeListener,
): PostgresRealtimeRelease {
  let entry = pools.get(dedupeKey);
  if (!entry) {
    const supabase = createClient();
    const channel = supabase.channel(`postgres-${dedupeKey}`);
    channel.on(
      "postgres_changes",
      {
        event: config.event ?? "*",
        schema: config.schema ?? "public",
        table: config.table,
        ...(config.filter ? { filter: config.filter } : {}),
      },
      () => {
        pools.get(dedupeKey)?.listeners.forEach((fn) => fn());
      },
    );
    void channel.subscribe();
    entry = {
      supabase,
      channel,
      listeners: new Set(),
      refCount: 0,
    };
    pools.set(dedupeKey, entry);
  }

  entry.listeners.add(listener);
  entry.refCount += 1;

  return () => {
    const current = pools.get(dedupeKey);
    if (!current) return;

    current.listeners.delete(listener);
    current.refCount -= 1;

    if (current.refCount <= 0 && current.listeners.size === 0) {
      void current.supabase.removeChannel(current.channel);
      pools.delete(dedupeKey);
    }
  };
}
