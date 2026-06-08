"use client";

import { Bell } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CustomerNotificationsList } from "./CustomerNotificationsList";
import {
  CUSTOMER_NOTIFICATIONS_BADGE_CLASS,
  CUSTOMER_NOTIFICATIONS_BUTTON_CLASS,
  CUSTOMER_NOTIFICATIONS_MENU_BODY_CLASS,
  CUSTOMER_NOTIFICATIONS_MENU_CLASS,
  CUSTOMER_NOTIFICATIONS_MENU_HEADER_CLASS,
  CUSTOMER_NOTIFICATIONS_MENU_REVEAL_CLASS,
  CUSTOMER_NOTIFICATIONS_TITLE,
} from "./constants";
import type { CustomerNotificationsMenuProps } from "./types";

export function CustomerNotificationsMenu({
  open,
  alerts,
  unackedCount,
  menuRef,
  onToggle,
  onClose,
}: CustomerNotificationsMenuProps) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        className={CUSTOMER_NOTIFICATIONS_BUTTON_CLASS}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        {unackedCount > 0 ? (
          <span className={CUSTOMER_NOTIFICATIONS_BADGE_CLASS}>
            {unackedCount > 9 ? "9+" : unackedCount}
          </span>
        ) : null}
      </button>

      <Reveal show={open} className={CUSTOMER_NOTIFICATIONS_MENU_REVEAL_CLASS}>
        <div role="menu" className={CUSTOMER_NOTIFICATIONS_MENU_CLASS}>
          <div className={CUSTOMER_NOTIFICATIONS_MENU_HEADER_CLASS}>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {CUSTOMER_NOTIFICATIONS_TITLE}
            </p>
          </div>
          <div className={CUSTOMER_NOTIFICATIONS_MENU_BODY_CLASS}>
            <CustomerNotificationsList alerts={alerts} onItemNavigate={onClose} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
