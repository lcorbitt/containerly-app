import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `organization_members` — membership row for org + user. */
export async function fetchMembershipByOrgAndUser(
  client: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  return client
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
}

/** `organization_members` — role check (e.g. admin-only shipment delete). */
export async function fetchMembershipRoleForOrg(
  client: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  return client
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
}

/** `organization_members` — used when creating tracking requests (creator must be member). */
export async function fetchMembershipUserIdForOrg(
  client: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  return client
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
}

/** `organization_members` — count rows for user (e.g. customer vs operator). */
export async function countMembershipsForUser(client: SupabaseClient, userId: string) {
  return client.from("organization_members").select("id", { count: "exact", head: true }).eq("user_id", userId);
}

/** Active org operator seat (admin or member) for a user in one organization. */
export async function fetchOrgOperatorMembershipForUser(
  client: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  return client
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .in("role", ["admin", "member"])
    .maybeSingle();
}
