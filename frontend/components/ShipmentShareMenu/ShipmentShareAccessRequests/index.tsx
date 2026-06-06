"use client";

import type { ShipmentAccessTabContentState } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { SHIPMENT_SHARE_ACCESS_REQUESTS_TITLE_CLASS } from "./constants";

export interface ShipmentShareAccessRequestsProps {
  state: ShipmentAccessTabContentState;
}

export function ShipmentShareAccessRequests({ state }: ShipmentShareAccessRequestsProps) {
  if (state.loading || state.pendingAccessRequests.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className={SHIPMENT_SHARE_ACCESS_REQUESTS_TITLE_CLASS}>Access requests</h3>
      <ul className="space-y-2">
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
