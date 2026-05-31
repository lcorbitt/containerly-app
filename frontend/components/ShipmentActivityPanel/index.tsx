"use client";

import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { TimelineEvent } from "@shared/dto/shipment.dto";
import { formatTimestamp } from "@/utils/datetime";

export function ShipmentActivityPanel({
  activityEvents,
  trackingEvents,
}: {
  activityEvents: ShipmentActivityEvent[];
  trackingEvents?: TimelineEvent[];
}) {
  type UnifiedItem = {
    id: string;
    occurred_at: string;
    body: string;
    kind: "activity" | "tracking";
  };

  const items: UnifiedItem[] = [
    ...activityEvents.map((e) => ({
      id: e.id,
      occurred_at: e.occurred_at,
      body: e.body,
      kind: "activity" as const,
    })),
    ...(trackingEvents ?? []).map((e) => ({
      id: `tr-${e.id}`,
      occurred_at: e.occurred_at,
      body: [e.event_type, e.status, e.location ? JSON.stringify(e.location) : null]
        .filter(Boolean)
        .join(" · "),
      kind: "tracking" as const,
    })),
  ].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Documentation milestones and carrier updates in one timeline.
      </p>
      {items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">No activity yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-zinc-100 px-3 py-3 dark:border-zinc-800"
            >
              <p className="text-[11px] text-zinc-500">{formatTimestamp(item.occurred_at)}</p>
              <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{item.body}</p>
              {item.kind === "tracking" ? (
                <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-zinc-400">
                  Carrier update
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
