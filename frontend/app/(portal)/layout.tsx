import { loadAuthenticatedLayoutSession } from "@/server/loaders/authenticated-layout";
import { AuthenticatedAppShell } from "@/app/(authenticated)/components/AuthenticatedAppShell";
import { CustomerAppShell } from "@/app/(customer)/components/CustomerAppShell";
import { PortalLayoutShell } from "./components/PortalLayoutShell";

/** Shipment portal — full operator shell on hub routes; customer sidenav for importers; guest top nav only. */
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

  if (session?.isCustomer) {
    return (
      <CustomerAppShell
        userId={session.user.id}
        email={session.user.email ?? ""}
        fullName={session.profile?.full_name ?? null}
        initialProfileImagePath={session.profile?.profile_image_path ?? null}
      >
        {children}
      </CustomerAppShell>
    );
  }

  return <PortalLayoutShell>{children}</PortalLayoutShell>;
}
