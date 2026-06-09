"use client";

import { MessageSquare } from "lucide-react";
import { MessagesList } from "@/app/(authenticated)/components/MessagesList";
import { useFeedbackWidgetControls } from "@/components/FeedbackWidget";
import { SubSideNav } from "@/components/SubSideNav";
import { WorkspaceQuickSearch } from "@/components/WorkspaceQuickSearch";
import { useSideNav } from "./hooks/useSideNav";
import {
  adminNavItems,
  alertsNavItem,
  automationsNavItem,
  customersNavItem,
  dashboardNavItem,
  documentsNavItem,
  helpNavItem,
  reportsNavItem,
  settingsNavItem,
  shipmentsNavItem,
  toolsNavGroup,
} from "./constants";
import { SideNavExpandableGroup } from "./SideNavExpandableGroup";
import { SideNavLink } from "./SideNavLink";
import { SideNavPanelTrigger } from "./SideNavPanelTrigger";
import { isSideNavLinkActive } from "./utils";

export function SideNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const {
    pathname,
    selectedOrgId,
    isFreight,
    messagesOpen,
    messageThreads,
    unreadCount,
    alertsCount,
    toolsExpanded,
    toggleMessages,
    toggleTools,
    closeSecondaryPanel,
  } = useSideNav(isSuperAdmin);
  const { openFeedback } = useFeedbackWidgetControls();

  return (
    <aside className="relative z-[100] box-border flex h-full min-h-0 shrink-0 overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80">
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

            {isFreight ? (
              <SideNavLink
                href={alertsNavItem.href}
                label={alertsNavItem.label}
                icon={alertsNavItem.icon}
                active={isSideNavLinkActive(pathname, alertsNavItem.href)}
                badgeCount={alertsCount}
              />
            ) : null}

            {selectedOrgId ? (
              <SideNavPanelTrigger
                label="Messages"
                icon={MessageSquare}
                active={messagesOpen}
                badgeCount={unreadCount}
                ariaControls="app-messages-panel"
                triggerId="app-messages-trigger"
                onClick={toggleMessages}
              />
            ) : null}

            {isFreight ? (
              <>
                <SideNavLink
                  href={documentsNavItem.href}
                  label={documentsNavItem.label}
                  icon={documentsNavItem.icon}
                  active={isSideNavLinkActive(pathname, documentsNavItem.href)}
                />
                <SideNavLink
                  href={customersNavItem.href}
                  label={customersNavItem.label}
                  icon={customersNavItem.icon}
                  active={isSideNavLinkActive(pathname, customersNavItem.href)}
                />
              </>
            ) : null}

            {isFreight ? (
              <>
                <SideNavLink
                  href={automationsNavItem.href}
                  label={automationsNavItem.label}
                  icon={automationsNavItem.icon}
                  active={isSideNavLinkActive(pathname, automationsNavItem.href)}
                />
                <SideNavExpandableGroup
                  label={toolsNavGroup.label}
                  icon={toolsNavGroup.icon}
                  items={toolsNavGroup.items}
                  expanded={toolsExpanded}
                  onToggle={toggleTools}
                  pathname={pathname}
                />
              </>
            ) : null}

            {isFreight ? (
              <SideNavLink
                href={reportsNavItem.href}
                label={reportsNavItem.label}
                icon={reportsNavItem.icon}
                active={isSideNavLinkActive(pathname, reportsNavItem.href)}
              />
            ) : null}
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
          <div className="flex flex-col gap-2">
            <SideNavLink
              href={settingsNavItem.href}
              label={settingsNavItem.label}
              icon={settingsNavItem.icon}
              active={isSideNavLinkActive(pathname, settingsNavItem.href)}
            />
            <SideNavPanelTrigger
              label={helpNavItem.label}
              icon={helpNavItem.icon}
              active={false}
              ariaControls="feedback-modal"
              triggerId="app-help-support-trigger"
              onClick={() => openFeedback()}
            />
          </div>
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
