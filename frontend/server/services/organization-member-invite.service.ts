import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile, isSuperadminRole } from "@/lib/auth/profile";
import type { OrganizationMemberRole } from "@/types/database";
import { resolveUserIdByEmail } from "@/server/services/organization-invite.service";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function inviteOrAddOrganizationMember(input: {
  supabase: SupabaseClient;
  admin: AdminClient;
  actingUserId: string;
  organizationId: string;
  emailLower: string;
  role: OrganizationMemberRole;
}): Promise<
  | { ok: true; membership: Record<string, unknown>; invited: boolean }
  | { ok: false; error: string; status: number }
> {
  if (!input.organizationId) {
    return { ok: false, error: "organization_id is required", status: 400 };
  }
  if (!input.emailLower || !input.emailLower.includes("@")) {
    return { ok: false, error: "Valid email is required", status: 400 };
  }

  const sessionProfile = await getSessionProfile(input.supabase, input.actingUserId);

  if (!isSuperadminRole(sessionProfile?.role)) {
    const { data: mem } = await input.supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", input.organizationId)
      .eq("user_id", input.actingUserId)
      .maybeSingle();
    if (mem?.role !== "admin") {
      return { ok: false, error: "Forbidden", status: 403 };
    }
  }

  const resolved = await resolveUserIdByEmail(input.admin, input.emailLower);
  if (resolved.error || !resolved.userId) {
    return { ok: false, error: resolved.error ?? "Could not resolve user", status: 400 };
  }

  const { data: inserted, error: insErr } = await input.supabase
    .from("organization_members")
    .insert({
      organization_id: input.organizationId,
      user_id: resolved.userId,
      role: input.role,
    })
    .select("id, organization_id, user_id, role, created_at")
    .single();

  if (insErr) {
    const dup = /duplicate|unique/i.test(insErr.message);
    return { ok: false, error: insErr.message, status: dup ? 409 : 500 };
  }

  return { ok: true, membership: inserted as Record<string, unknown>, invited: resolved.invited };
}
