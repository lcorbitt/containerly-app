import { createClient } from "@/lib/supabase/client";
import type { OrgMembershipRow } from "@/types/organization-workspace";

export async function fetchOrganizationMembershipRows(input: {
  userId: string;
  isSuperAdmin: boolean;
}): Promise<OrgMembershipRow[]> {
  const supabase = createClient();
  if (input.isSuperAdmin) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, org_image_path, created_at, updated_at")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((o) => ({
      role: "platform",
      organizations: o,
    }));
  }
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug, org_image_path, created_at, updated_at)")
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const o = row.organizations;
    const org = Array.isArray(o) ? o[0] : o;
    return { role: row.role as string, organizations: org ?? null };
  });
}
