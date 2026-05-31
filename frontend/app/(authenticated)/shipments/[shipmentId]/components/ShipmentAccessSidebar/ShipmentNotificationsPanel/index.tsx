"use client";

import { Bell } from "lucide-react";
import {
  SHIPMENT_NOTIFICATIONS_SUBSCRIBE_BTN_ACTIVE_CLASS,
  SHIPMENT_NOTIFICATIONS_SUBSCRIBE_BTN_CLASS,
  SHIPMENT_NOTIFICATIONS_SUBSCRIBED_MESSAGE,
  SHIPMENT_NOTIFICATIONS_UNSUBSCRIBED_MESSAGE,
} from "./constants";
import type { ShipmentNotificationsPanelState } from "./useShipmentNotificationsPanel";

export function ShipmentNotificationsPanel({ state }: { state: ShipmentNotificationsPanelState }) {
  const { subscribed, saving, toggle } = state;

  return (
    <section aria-label="Shipment notifications">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Notifications
      </h3>
      <button
        type="button"
        disabled={saving}
        onClick={() => void toggle()}
        aria-pressed={subscribed}
        className={`mt-2.5 ${subscribed ? SHIPMENT_NOTIFICATIONS_SUBSCRIBE_BTN_ACTIVE_CLASS : SHIPMENT_NOTIFICATIONS_SUBSCRIBE_BTN_CLASS}`}
      >
        <Bell
          className={`h-4 w-4 shrink-0 ${subscribed ? "fill-current text-zinc-700 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-400"}`}
          strokeWidth={subscribed ? 0 : 2}
          aria-hidden
        />
        {subscribed ? "Unsubscribe" : "Subscribe"}
      </button>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {subscribed
          ? SHIPMENT_NOTIFICATIONS_SUBSCRIBED_MESSAGE
          : SHIPMENT_NOTIFICATIONS_UNSUBSCRIBED_MESSAGE}
      </p>
    </section>
  );
}
