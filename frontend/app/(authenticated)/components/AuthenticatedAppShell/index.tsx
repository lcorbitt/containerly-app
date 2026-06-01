import { OrganizationWorkspaceProvider } from "@/contexts/organization-workspace";
import { SessionAvatarProvider } from "@/contexts/session-avatar";
import { AuthenticatedTopNav } from "@/components/TopNav";
import { MockJourneyModalProvider } from "@/contexts/mock-journey-modal";
import { NewShipmentModalProvider } from "@/components/NewShipmentModal";
import { AuthenticatedMainPane } from "../AuthenticatedMainPane";
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
  children,
}: AuthenticatedAppShellProps) {
  return (
    <OrganizationWorkspaceProvider
      initialOrgs={initialOrgs}
      isSuperAdmin={isSuperAdmin}
      userId={userId}
    >
      <SessionAvatarProvider initialProfileImagePath={initialProfileImagePath}>
        <NewShipmentModalProvider>
          <MockJourneyModalProvider>
            <div className={AUTHENTICATED_APP_SHELL_ROOT_CLASS}>
              <AuthenticatedTopNav email={email} fullName={fullName} />
              <div className={AUTHENTICATED_APP_SHELL_BODY_CLASS}>
                <SideNav isSuperAdmin={isSuperAdmin} />
                <div className={AUTHENTICATED_APP_SHELL_MAIN_CLASS}>
                  <div className={AUTHENTICATED_APP_SHELL_MAIN_INNER_CLASS}>
                    <AuthenticatedMainPane>{children}</AuthenticatedMainPane>
                  </div>
                </div>
              </div>
            </div>
          </MockJourneyModalProvider>
        </NewShipmentModalProvider>
      </SessionAvatarProvider>
    </OrganizationWorkspaceProvider>
  );
}
