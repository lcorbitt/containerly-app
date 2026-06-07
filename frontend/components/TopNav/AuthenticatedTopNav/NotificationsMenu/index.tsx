"use client";

import { Bell } from "lucide-react";
import { NotificationsList } from "@/app/(authenticated)/components/NotificationsList";
import { Reveal } from "@/components/Reveal";
import {
  AUTHENTICATED_TOP_NAV_NOTIFICATIONS_BUTTON_CLASS,
  AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_BODY_CLASS,
  AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_CLASS,
  AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_HEADER_CLASS,
  AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_REVEAL_CLASS,
} from "./constants";
import type { NotificationsMenuProps } from "./types";

export function NotificationsMenu({
  open,
  alerts,
  unackedCount,
  menuRef,
  onToggle,
  onClose,
}: NotificationsMenuProps) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        className={AUTHENTICATED_TOP_NAV_NOTIFICATIONS_BUTTON_CLASS}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        {unackedCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[10px] font-semibold text-white dark:bg-red-500">
            {unackedCount > 9 ? "9+" : unackedCount}
          </span>
        ) : null}
      </button>

      <Reveal show={open} className={AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_REVEAL_CLASS}>
        <div role="menu" className={AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_CLASS}>
          <div className={AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_HEADER_CLASS}>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</p>
          </div>
          <div className={AUTHENTICATED_TOP_NAV_NOTIFICATIONS_MENU_BODY_CLASS}>
            <NotificationsList alerts={alerts} onItemNavigate={onClose} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
