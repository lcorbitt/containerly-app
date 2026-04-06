import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { OrganizationMemberRole } from "@/types/database";

export type OrgMemberRow = {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: OrganizationMemberRole;
  createdAt: string;
};

export async function fetchOrganizationMetrics(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<{ trackingRequests: number | null; shipments: number | null; members: number | null }> {
  const [tr, sh, mem] = await Promise.all([
    supabase
      .from("tracking_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);
  return {
    trackingRequests: tr.count ?? null,
    shipments: sh.count ?? null,
    members: mem.count ?? null,
  };
}

export async function fetchOrganizationMemberRows(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgMemberRow[]> {
  const { data: mRows, error: mErr } = await supabase
    .from("organization_members")
    .select("id, user_id, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (mErr) throw mErr;
  const list = mRows ?? [];
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
    const prof = profileByUser.get(m.user_id);
    return {
      membershipId: m.id,
      userId: m.user_id,
      fullName: prof?.fullName ?? null,
      email: prof?.email ?? null,
      role: m.role as OrganizationMemberRole,
      createdAt: m.created_at,
    };
  });
}

export async function updateOrganizationNameAndSlug(
  supabase: SupabaseClient,
  organizationId: string,
  name: string,
  slug: string,
): Promise<void> {
  const { error } = await supabase.from("organizations").update({ name, slug }).eq("id", organizationId);
  if (error) throw new Error(error.message);
}

export async function deleteOrganizationMemberById(
  supabase: SupabaseClient,
  membershipId: string,
): Promise<void> {
  const { error } = await supabase.from("organization_members").delete().eq("id", membershipId);
  if (error) throw new Error(error.message);
}

export async function fetchOrganizationMetricsBrowser(organizationId: string) {
  return fetchOrganizationMetrics(createClient(), organizationId);
}

export async function fetchOrganizationMemberRowsBrowser(organizationId: string) {
  return fetchOrganizationMemberRows(createClient(), organizationId);
}

export async function updateOrganizationNameAndSlugBrowser(
  organizationId: string,
  name: string,
  slug: string,
) {
  return updateOrganizationNameAndSlug(createClient(), organizationId, name, slug);
}

export async function deleteOrganizationMemberByIdBrowser(membershipId: string) {
  return deleteOrganizationMemberById(createClient(), membershipId);
}
