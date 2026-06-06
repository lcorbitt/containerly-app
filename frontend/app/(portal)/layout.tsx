import { loadAuthenticatedLayoutSession } from "@/services/authenticated-layout.server";
import { PortalLayoutShell } from "./components/PortalLayoutShell";

/** Auth-gated shipment portal — operator top nav when signed in as freight; customer nav otherwise. */
export default async function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await loadAuthenticatedLayoutSession();
  const operatorSession =
    session && !session.isCustomer
      ? {
          userId: session.user.id,
          initialOrgs: session.initialOrgs,
          isSuperAdmin: session.isSuperAdmin,
          initialProfileImagePath: session.profile?.profile_image_path ?? null,
        }
      : null;

  return <PortalLayoutShell operatorSession={operatorSession}>{children}</PortalLayoutShell>;
}
