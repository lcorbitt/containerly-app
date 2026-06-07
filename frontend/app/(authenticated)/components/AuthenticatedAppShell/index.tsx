import { OrganizationWorkspaceProvider } from "@/contexts/organization-workspace";
import { AuthenticatedTopNav } from "@/components/TopNav";
import { MockJourneyModalHost } from "@/contexts/mock-journey-modal";
import { SessionAvatarInit } from "@/components/SessionAvatarInit";
import { NewShipmentModalProvider } from "@/components/NewShipmentModal";
import { AuthenticatedMainPane } from "../AuthenticatedMainPane";
import { OrgWorkspaceRealtimeBridge } from "../OrgWorkspaceRealtimeBridge";
import { SideNav } from "../SideNav";
import {
  AUTHENTICATED_APP_SHELL_BODY_CLASS,
  AUTHENTICATED_APP_SHELL_MAIN_CLASS,
  AUTHENTICATED_APP_SHELL_MAIN_INNER_CLASS,
  AUTHENTICATED_APP_SHELL_ROOT_CLASS,
} from "./constants";
import type { AuthenticatedAppShellProps } from "./types";

/** Persistent chrome for all `(authenticated)` routes; page content swaps in `{children}`. */
export function AuthenticatedAppShell({
  userId,
  email,
  fullName,
  initialProfileImagePath,
  initialOrgs,
  isSuperAdmin,
  isCustomer,
  children,
}: AuthenticatedAppShellProps) {
  return (
    <OrganizationWorkspaceProvider
      initialOrgs={initialOrgs}
      isSuperAdmin={isSuperAdmin}
      userId={userId}
    >
      <SessionAvatarInit initialProfileImagePath={initialProfileImagePath} />
      <NewShipmentModalProvider>
        <MockJourneyModalHost>
          <OrgWorkspaceRealtimeBridge />
            <div className={AUTHENTICATED_APP_SHELL_ROOT_CLASS}>
              <AuthenticatedTopNav />
              <div className={AUTHENTICATED_APP_SHELL_BODY_CLASS}>
                <SideNav
                  isSuperAdmin={isSuperAdmin}
                  isCustomer={isCustomer}
                  email={email}
                  fullName={fullName}
                />
                <div className={AUTHENTICATED_APP_SHELL_MAIN_CLASS} data-authenticated-main-scroll>
                  <div className={AUTHENTICATED_APP_SHELL_MAIN_INNER_CLASS}>
                    <AuthenticatedMainPane>{children}</AuthenticatedMainPane>
                  </div>
                </div>
              </div>
            </div>
        </MockJourneyModalHost>
      </NewShipmentModalProvider>
    </OrganizationWorkspaceProvider>
  );
}
