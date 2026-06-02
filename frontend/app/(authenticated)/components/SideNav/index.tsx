"use client";

import { MessageSquare } from "lucide-react";
import { MessagesList } from "@/app/(authenticated)/components/MessagesList";
import { SubSideNav } from "@/components/SubSideNav";
import { WorkspaceQuickSearch } from "@/components/WorkspaceQuickSearch";
import { useSideNav } from "./hooks/useSideNav";
import {
  adminNavItems,
  dashboardNavItem,
  howItWorksNavItem,
  REPORTS_NAV_DISABLED_TOOLTIP,
  reportsNavItem,
  settingsNavItem,
  shipmentsNavItem,
} from "./constants";
import { SideNavAccountMenu } from "./SideNavAccountMenu";
import { SideNavDisabledLink } from "./SideNavDisabledLink";
import { SideNavLink } from "./SideNavLink";
import { SideNavPanelTrigger } from "./SideNavPanelTrigger";
import { isSideNavLinkActive } from "./utils";

export function SideNav({
  isSuperAdmin,
  email,
  fullName,
}: {
  isSuperAdmin: boolean;
  email: string;
  fullName?: string | null;
}) {
  const {
    pathname,
    selectedOrgId,
    isFreight,
    messagesOpen,
    messageThreads,
    needsReplyCount,
    toggleMessages,
    closeSecondaryPanel,
  } = useSideNav(isSuperAdmin);

  const howItWorksActive = isSideNavLinkActive(pathname, howItWorksNavItem.href);

  return (
    <aside className="box-border flex h-full min-h-0 shrink-0 overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex h-full min-h-0 w-54 min-w-54 flex-col overflow-hidden">
        <div className="shrink-0 p-4">
          <WorkspaceQuickSearch />
        </div>
        <nav
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4"
          aria-label="Main"
        >
          <div className="flex flex-col gap-2">
            {isFreight ? (
              <SideNavLink
                href={dashboardNavItem.href}
                label={dashboardNavItem.label}
                icon={dashboardNavItem.icon}
                active={isSideNavLinkActive(pathname, dashboardNavItem.href)}
              />
            ) : null}

            <SideNavLink
              href={shipmentsNavItem.href}
              label={shipmentsNavItem.label}
              icon={shipmentsNavItem.icon}
              active={isSideNavLinkActive(pathname, shipmentsNavItem.href)}
            />

            {selectedOrgId ? (
              <SideNavPanelTrigger
                label="Messages"
                icon={MessageSquare}
                active={messagesOpen}
                badgeCount={needsReplyCount}
                ariaControls="app-messages-panel"
                triggerId="app-messages-trigger"
                onClick={toggleMessages}
              />
            ) : null}

            {isFreight ? (
              <SideNavLink
                href={reportsNavItem.href}
                label={reportsNavItem.label}
                icon={reportsNavItem.icon}
                active={isSideNavLinkActive(pathname, reportsNavItem.href)}
              />
            ) : (
              <SideNavDisabledLink
                label={reportsNavItem.label}
                icon={reportsNavItem.icon}
                tooltip={REPORTS_NAV_DISABLED_TOOLTIP}
              />
            )}

            <SideNavLink
              href={settingsNavItem.href}
              label={settingsNavItem.label}
              icon={settingsNavItem.icon}
              active={isSideNavLinkActive(pathname, settingsNavItem.href)}
            />

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
          ) : null}
        </nav>

        <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <SideNavAccountMenu email={email} fullName={fullName} />
        </div>
      </div>

      <SubSideNav
        title="Messages"
        open={messagesOpen && Boolean(selectedOrgId)}
        onOpenChange={(open) => {
          if (!open) closeSecondaryPanel();
        }}
      >
        <div id="app-messages-panel" role="region" aria-labelledby="app-messages-trigger">
          <MessagesList threads={messageThreads} onItemNavigate={closeSecondaryPanel} />
        </div>
      </SubSideNav>
    </aside>
  );
}
