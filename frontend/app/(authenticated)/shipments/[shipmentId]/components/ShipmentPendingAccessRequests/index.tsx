"use client";

import type { ShipmentAccessTabContentState } from "../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";

export function ShipmentPendingAccessRequests({ state }: { state: ShipmentAccessTabContentState }) {
  if (state.loading || state.pendingAccessRequests.length === 0) return null;

  return (
    <div className="border-b border-zinc-200 py-4 dark:border-zinc-800">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Access requests
      </h3>
      <ul className="mt-2 space-y-2">
        {state.pendingAccessRequests.map((req) => {
          const busy = state.resolvingRequestId === req.id;
          return (
            <li
              key={req.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {req.requester_email}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void state.resolveAccessRequestRow(req.id, "approve")}
                  className="flex-1 rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {busy ? "…" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void state.resolveAccessRequestRow(req.id, "deny")}
                  className="flex-1 rounded-md border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Deny
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
