import { loadAuthenticatedLayoutSession } from "@/services/authenticated-layout.server";
import { AuthenticatedAppShell } from "@/app/(authenticated)/components/AuthenticatedAppShell";
import { PortalLayoutShell } from "./components/PortalLayoutShell";

/** Shipment portal — full operator shell on hub routes; customer nav for importers and guests. */
export default async function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await loadAuthenticatedLayoutSession();

  if (session && !session.isCustomer) {
    return (
      <AuthenticatedAppShell
        userId={session.user.id}
        email={session.user.email ?? ""}
        fullName={session.profile?.full_name ?? null}
        initialProfileImagePath={session.profile?.profile_image_path ?? null}
        initialOrgs={session.initialOrgs}
        isSuperAdmin={session.isSuperAdmin}
        isCustomer={false}
      >
        {children}
      </AuthenticatedAppShell>
    );
  }

  return <PortalLayoutShell>{children}</PortalLayoutShell>;
}
