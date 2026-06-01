"use client";

import { Bell } from "lucide-react";
import { NotificationsList } from "@/app/(authenticated)/components/NotificationsList";
import { SubSideNav } from "@/components/SubSideNav";
import { WorkspaceQuickSearch } from "@/components/WorkspaceQuickSearch";
import { useSideNav } from "./hooks/useSideNav";
import { adminNavItems, howItWorksNavItem } from "./constants";
import { SideNavLink } from "./SideNavLink";
import { getSideNavLinkClassName, isSideNavLinkActive } from "./utils";

export function SideNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const {
    pathname,
    selectedOrgId,
    notificationsOpen,
    alerts,
    unackedCount,
    mainNavItems,
    toggleNotifications,
    closeNotifications,
  } = useSideNav(isSuperAdmin);

  const howItWorksActive = isSideNavLinkActive(pathname, howItWorksNavItem.href);

  return (
    <aside className="box-border flex h-full min-h-0 shrink-0 overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex w-54 min-w-54 flex-col overflow-hidden">
        <div className="shrink-0 p-4">
          <WorkspaceQuickSearch />
        </div>
        <nav
          className="flex h-full min-h-0 flex-1 flex-col justify-between overflow-hidden px-4"
          aria-label="Main"
        >
          <div className="flex min-h-0 flex-col gap-2">
            {mainNavItems.map(({ href, label, icon }) => (
              <SideNavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={isSideNavLinkActive(pathname, href)}
              />
            ))}

            {selectedOrgId ? (
              <button
                type="button"
                onClick={toggleNotifications}
                className={`relative cursor-pointer text-left ${getSideNavLinkClassName(notificationsOpen)}`}
                aria-expanded={notificationsOpen}
                aria-controls="app-notifications-panel"
                id="app-notifications-trigger"
              >
                <Bell className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                <span className="min-w-0 wrap-break-word">Notifications</span>
                {unackedCount > 0 ? (
                  <span className="absolute right-2 top-1/2 flex h-[1.125rem] min-w-[1.125rem] -translate-y-1/2 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white dark:bg-red-500">
                    {unackedCount > 9 ? "9+" : unackedCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            <SideNavLink
              href={howItWorksNavItem.href}
              label={howItWorksNavItem.label}
              icon={howItWorksNavItem.icon}
              active={howItWorksActive}
            />
          </div>

          {isSuperAdmin ? (
            <div
              className="shrink-0 border-t border-zinc-200 pt-2 dark:border-zinc-800"
              title="Platform role bypasses RLS; not an organization membership."
            >
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Super Admin
              </p>
              <div className="flex flex-col gap-2">
                {adminNavItems.map(({ href, label, icon }) => (
                  <SideNavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    active={isSideNavLinkActive(pathname, href)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="shrink-0" aria-hidden />
          )}
        </nav>
      </div>

      <SubSideNav
        title="Notifications"
        open={notificationsOpen && Boolean(selectedOrgId)}
        onOpenChange={closeNotifications}
      >
        <div id="app-notifications-panel" role="region" aria-labelledby="app-notifications-trigger">
          <NotificationsList alerts={alerts} onItemNavigate={closeNotifications} />
        </div>
      </SubSideNav>
    </aside>
  );
}
