"use client";

import { Package, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { SideNavLink } from "@/app/(authenticated)/components/SideNav/SideNavLink";
import { SideNavAccountMenu } from "@/app/(authenticated)/components/SideNav/SideNavAccountMenu";
import { isSideNavLinkActive } from "@/app/(authenticated)/components/SideNav/utils";
import { customerNavItems } from "./constants";

const NAV_ICONS = {
  "Shared With Me": Package,
  Settings,
} as const;

export function CustomerSideNav({
  email,
  fullName,
}: {
  email: string;
  fullName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="relative z-[100] box-border flex h-full min-h-0 shrink-0 overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex h-full min-h-0 w-54 min-w-54 flex-col overflow-hidden">
        <nav
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 pt-4"
          aria-label="Main"
        >
          {customerNavItems.map(({ href, label }) => {
            const Icon = NAV_ICONS[label as keyof typeof NAV_ICONS];
            return (
              <SideNavLink
                key={href}
                href={href}
                label={label}
                icon={Icon}
                active={isSideNavLinkActive(pathname, href)}
              />
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <SideNavAccountMenu email={email} fullName={fullName} isCustomer />
        </div>
      </div>
    </aside>
  );
}
