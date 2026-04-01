import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrackingDashboard } from "@/components/tracking-dashboard";

export const dynamic = "force-dynamic";

type OrgRow = {
  role: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
  } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug, created_at, updated_at)")
    .eq("user_id", user.id);

  const initialOrgs: OrgRow[] = (memberships ?? []).map((row) => {
    const o = row.organizations;
    const org = Array.isArray(o) ? o[0] : o;
    return { role: row.role as string, organizations: org ?? null };
  });

  return <TrackingDashboard initialOrgs={initialOrgs} />;
}
