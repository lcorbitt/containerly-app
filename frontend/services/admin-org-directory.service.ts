import { createClient } from "@/lib/supabase/client";
import type { OrganizationMemberRole } from "@/types/database";

export type AdminOrgMemberRow = {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: OrganizationMemberRole;
  createdAt: string;
};

/** Superadmin: all organization memberships with profile fields (browser Supabase + RLS bypass for superadmin). */
export async function fetchAdminOrgMemberDirectoryRows(): Promise<AdminOrgMemberRow[]> {
  const supabase = createClient();
  const { data: members, error: mErr } = await supabase
    .from("organization_members")
    .select("id, user_id, role, created_at, organization_id, organizations(id, name)")
    .order("created_at", { ascending: true });

  if (mErr) throw mErr;
  const list = members ?? [];
  const userIds = [...new Set(list.map((m) => m.user_id))];
  if (userIds.length === 0) return [];

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  if (pErr) throw pErr;
  const profileByUser = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { email: p.email as string | null, fullName: (p.full_name as string | null) ?? null },
    ]),
  );

  return list.map((m) => {
    const o = m.organizations as { id: string; name: string } | { id: string; name: string }[] | null;
    const org = Array.isArray(o) ? o[0] : o;
    const prof = profileByUser.get(m.user_id);
    return {
      membershipId: m.id,
      organizationId: m.organization_id,
      organizationName: org?.name ?? "—",
      userId: m.user_id,
      fullName: prof?.fullName ?? null,
      email: prof?.email ?? null,
      role: m.role as OrganizationMemberRole,
      createdAt: m.created_at,
    };
  });
}
