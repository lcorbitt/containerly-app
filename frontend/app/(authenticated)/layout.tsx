import { redirect } from "next/navigation";
import { OrganizationWorkspaceProvider } from "@/contexts/organization-workspace";
import type { OrgMembershipRow } from "@/types/organization-workspace";
import { SessionAvatarProvider } from "@/contexts/session-avatar";
import { getSessionProfile } from "@/services/auth-server.service";
import { isSuperadminRole } from "@/utils/profile-role";
import { createClient } from "@/lib/supabase/server";
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

  let initialOrgs: OrgMembershipRow[];
  if (isSuperAdmin) {
    const { data: allOrgs } = await supabase
      .from("organizations")
      .select("id, name, slug, org_image_path, created_at, updated_at")
      .order("name");
    initialOrgs = (allOrgs ?? []).map((o) => ({
      role: "platform",
      organizations: o,
    }));
  } else {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name, slug, org_image_path, created_at, updated_at)")
      .eq("user_id", user.id);

    initialOrgs = (memberships ?? []).map((row) => {
      const o = row.organizations;
      const org = Array.isArray(o) ? o[0] : o;
      return { role: row.role as string, organizations: org ?? null };
    });
  }

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
              <AuthenticatedTopNav email={user.email ?? ""} />
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
