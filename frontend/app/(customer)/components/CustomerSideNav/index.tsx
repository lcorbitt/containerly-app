"use client";

import { MessageSquare, Package, Settings } from "lucide-react";
import { MessagesList } from "@/app/(authenticated)/components/MessagesList";
import { SideNavLink } from "@/app/(authenticated)/components/SideNav/SideNavLink";
import { SideNavAccountMenu } from "@/app/(authenticated)/components/SideNav/SideNavAccountMenu";
import { SideNavPanelTrigger } from "@/app/(authenticated)/components/SideNav/SideNavPanelTrigger";
import { isSideNavLinkActive } from "@/app/(authenticated)/components/SideNav/utils";
import { SubSideNav } from "@/components/SubSideNav";
import { CUSTOMER_MY_SHIPMENTS_LABEL } from "@/components/TopNav/CustomerTopNav/constants";
import { customerMyShipmentsNavItem, customerSettingsNavItem } from "./constants";
import { useCustomerSideNav } from "./useCustomerSideNav";

const NAV_ICONS = {
  [CUSTOMER_MY_SHIPMENTS_LABEL]: Package,
} as const;

export function CustomerSideNav({
  email,
  fullName,
}: {
  email: string;
  fullName?: string | null;
}) {
  const {
    pathname,
    messagesOpen,
    messageThreads,
    unreadCount,
    toggleMessages,
    closeSecondaryPanel,
  } = useCustomerSideNav();

  return (
    <aside className="relative z-[100] box-border flex h-full min-h-0 shrink-0 overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex h-full min-h-0 w-54 min-w-54 flex-col overflow-hidden">
        <nav
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 pt-4"
          aria-label="Main"
        >
          <SideNavLink
            href={customerMyShipmentsNavItem.href}
            label={customerMyShipmentsNavItem.label}
            icon={NAV_ICONS[CUSTOMER_MY_SHIPMENTS_LABEL]}
            active={isSideNavLinkActive(pathname, customerMyShipmentsNavItem.href)}
          />

          <SideNavPanelTrigger
            label="Messages"
            icon={MessageSquare}
            active={messagesOpen}
            badgeCount={unreadCount}
            ariaControls="customer-messages-panel"
            triggerId="customer-messages-trigger"
            onClick={toggleMessages}
          />

          <SideNavLink
            href={customerSettingsNavItem.href}
            label={customerSettingsNavItem.label}
            icon={Settings}
            active={isSideNavLinkActive(pathname, customerSettingsNavItem.href)}
          />
        </nav>

        <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <SideNavAccountMenu email={email} fullName={fullName} isCustomer />
        </div>
      </div>

      <SubSideNav
        title="Messages"
        open={messagesOpen}
        onOpenChange={(open) => {
          if (!open) closeSecondaryPanel();
        }}
      >
        <div id="customer-messages-panel" role="region" aria-labelledby="customer-messages-trigger">
          <MessagesList
            threads={messageThreads}
            viewer="customer"
            onItemNavigate={closeSecondaryPanel}
          />
        </div>
      </SubSideNav>
    </aside>
  );
}
