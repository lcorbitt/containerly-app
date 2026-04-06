import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationMemberRole } from "@/types/database";

const ALLOWED: OrganizationMemberRole[] = ["admin", "member"];

export async function patchOrganizationMemberRoleForUser(input: {
  supabase: SupabaseClient;
  membershipId: string;
  role: string;
}): Promise<
  | { ok: true; membership: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  if (typeof input.role !== "string" || !ALLOWED.includes(input.role as OrganizationMemberRole)) {
    return { ok: false, error: "Invalid role", status: 400 };
  }

  const role = input.role as OrganizationMemberRole;

  const { data, error } = await input.supabase
    .from("organization_members")
    .update({ role })
    .eq("id", input.membershipId)
    .select("id, organization_id, user_id, role, created_at")
    .single();

  if (error) {
    const forbidden = /rls|policy|permission|denied/i.test(error.message);
    return { ok: false, error: error.message, status: forbidden ? 403 : 500 };
  }

  if (!data) {
    return { ok: false, error: "Membership not found", status: 404 };
  }

  return { ok: true, membership: data as Record<string, unknown> };
}
