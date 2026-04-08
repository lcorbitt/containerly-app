import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import type { OrganizationMemberRole } from "@/types/database";
import type { AdminOrgMemberRow } from "@/types/organization-directory";

export type AdminProfileTableRow = Pick<
  Profile,
  "id" | "email" | "full_name" | "role" | "created_at"
> & {
  organizations_label: string;
};

export async function loadAdminProfilesWithOrgLabels(supabase: SupabaseClient): Promise<{
  rows: AdminProfileTableRow[];
  profilesError: Error | null;
  membersError: Error | null;
}> {
  const [profilesRes, membersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("organization_members").select("user_id, organizations(name)"),
  ]);

  if (profilesRes.error) {
    return {
      rows: [],
      profilesError: new Error(profilesRes.error.message),
      membersError: membersRes.error ? new Error(membersRes.error.message) : null,
    };
  }

  const orgNamesByUser = new Map<string, Set<string>>();
  if (!membersRes.error) {
    for (const m of membersRes.data ?? []) {
      const o = m.organizations as { name: string } | { name: string }[] | null;
      const org = Array.isArray(o) ? o[0] : o;
      const name = org?.name?.trim();
      if (!name) continue;
      if (!orgNamesByUser.has(m.user_id)) orgNamesByUser.set(m.user_id, new Set());
      orgNamesByUser.get(m.user_id)!.add(name);
    }
  }

  const rows = (profilesRes.data ?? []).map((p) => ({
    ...p,
    organizations_label:
      [...(orgNamesByUser.get(p.id) ?? [])].sort((a, b) => a.localeCompare(b)).join(", ") || "—",
  })) as AdminProfileTableRow[];

  return {
    rows,
    profilesError: null,
    membersError: membersRes.error ? new Error(membersRes.error.message) : null,
  };
}

export async function fetchAdminOrgMemberDirectoryRowsQuery(
  supabase: SupabaseClient,
): Promise<AdminOrgMemberRow[]> {
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
