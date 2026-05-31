import { redirect } from "next/navigation";
import { OrganizationWorkspaceProvider } from "@/contexts/organization-workspace";
import type { OrgMembershipRow } from "@/types/organization-workspace";
import { SessionAvatarProvider } from "@/contexts/session-avatar";
import { getSessionProfile } from "@/services/auth-server.service";
import { isSuperadminRole } from "@/utils/profile-role";
import { createClient } from "@/lib/supabase/server";
import { fetchOrgMembershipRows } from "@/services/organization.server";
import { AuthenticatedTopNav } from "@/components/TopNav";
import { MockJourneyModalProvider } from "@/contexts/mock-journey-modal";
import { TrackContainerModalProvider } from "@/contexts/track-container-modal";
import { SideNav } from "./components/SideNav";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getSessionProfile(supabase, user.id);
  const isSuperAdmin = isSuperadminRole(profile?.role);

  const initialOrgs = await fetchOrgMembershipRows(supabase, user.id, isSuperAdmin);

  return (
    <OrganizationWorkspaceProvider
      initialOrgs={initialOrgs}
      isSuperAdmin={isSuperAdmin}
      userId={user.id}
    >
      <SessionAvatarProvider
        initialProfileImagePath={profile?.profile_image_path ?? null}
      >
        <TrackContainerModalProvider>
          <MockJourneyModalProvider>
            <div className="grid h-dvh min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
              <AuthenticatedTopNav
                email={user.email ?? ""}
                fullName={profile?.full_name ?? null}
              />
              <div className="flex min-h-0 overflow-hidden">
                <SideNav isSuperAdmin={isSuperAdmin} />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </MockJourneyModalProvider>
        </TrackContainerModalProvider>
      </SessionAvatarProvider>
    </OrganizationWorkspaceProvider>
  );
}
