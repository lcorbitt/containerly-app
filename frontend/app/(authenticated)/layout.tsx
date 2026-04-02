import { redirect } from "next/navigation";
import {
  OrganizationWorkspaceProvider,
  type OrgMembershipRow,
} from "@/contexts/organization-workspace";
import { getSessionProfile, isSuperadminRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { SideNav } from "./components/side-nav";
import { TopNav } from "./components/top-nav";

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
      .select("id, name, slug, created_at, updated_at")
      .order("name");
    initialOrgs = (allOrgs ?? []).map((o) => ({
      role: "platform",
      organizations: o,
    }));
  } else {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name, slug, created_at, updated_at)")
      .eq("user_id", user.id);

    initialOrgs = (memberships ?? []).map((row) => {
      const o = row.organizations;
      const org = Array.isArray(o) ? o[0] : o;
      return { role: row.role as string, organizations: org ?? null };
    });
  }

  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-1 flex-col overflow-hidden">
      <TopNav email={user.email ?? ""} />
      <div className="flex min-h-0 flex-1 items-stretch">
        <SideNav isSuperAdmin={isSuperAdmin} />
        <OrganizationWorkspaceProvider
          initialOrgs={initialOrgs}
          isSuperAdmin={isSuperAdmin}
          userId={user.id}
        >
          <div className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</div>
        </OrganizationWorkspaceProvider>
      </div>
    </div>
  );
}
