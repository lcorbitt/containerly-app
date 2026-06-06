"use client";

import { AuthenticatedTopNav, CustomerTopNav } from "@/components/TopNav";
import { NewShipmentModalProvider } from "@/components/NewShipmentModal";
import { SessionAvatarInit } from "@/components/SessionAvatarInit";
import { OrganizationWorkspaceProvider } from "@/contexts/organization-workspace";
import { MockJourneyModalHost } from "@/contexts/mock-journey-modal";
import { OrgWorkspaceRealtimeBridge } from "@/app/(authenticated)/components/OrgWorkspaceRealtimeBridge";
import { PORTAL_LAYOUT_SHELL_CLASS, PORTAL_LAYOUT_SHELL_MAIN_CLASS } from "./constants";
import type { PortalLayoutShellProps } from "./types";

export function PortalLayoutShell({ operatorSession, children }: PortalLayoutShellProps) {
  if (operatorSession) {
    return (
      <OrganizationWorkspaceProvider
        initialOrgs={operatorSession.initialOrgs}
        isSuperAdmin={operatorSession.isSuperAdmin}
        userId={operatorSession.userId}
      >
        <SessionAvatarInit initialProfileImagePath={operatorSession.initialProfileImagePath} />
        <NewShipmentModalProvider>
          <MockJourneyModalHost>
            <OrgWorkspaceRealtimeBridge />
            <div className={PORTAL_LAYOUT_SHELL_CLASS}>
              <AuthenticatedTopNav />
              <main className={PORTAL_LAYOUT_SHELL_MAIN_CLASS}>{children}</main>
            </div>
          </MockJourneyModalHost>
        </NewShipmentModalProvider>
      </OrganizationWorkspaceProvider>
    );
  }

  return (
    <div className={PORTAL_LAYOUT_SHELL_CLASS}>
      <CustomerTopNav />
      <main className={PORTAL_LAYOUT_SHELL_MAIN_CLASS}>{children}</main>
    </div>
  );
}
