import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/services/auth-server.service";
import { isSuperadminRole } from "@/utils/profile-role";
import { slugFromOrganizationName } from "@/utils/organization-slug";
import type { OrganizationMemberRole } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

// ---------------------------------------------------------------------------
// Organization creation
// ---------------------------------------------------------------------------

export async function createOrganizationWithInitialAdmin(input: {
  admin: AdminClient;
  name: string;
  slugInput: string | null;
  adminUserId: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string; status: number }> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "name is required", status: 400 };
  }

  const slug =
    (input.slugInput && input.slugInput.trim() !== "" ? input.slugInput.trim() : null) ??
    slugFromOrganizationName(name);
  const slugFinal = slug.trim();
  if (!slugFinal) {
    return { ok: false, error: "Invalid slug", status: 400 };
  }

  const { data: org, error: orgErr } = await input.admin
    .from("organizations")
    .insert({ name, slug: slugFinal })
    .select("id")
    .single();

  if (orgErr) {
    const msg = orgErr.message ?? "Could not create organization";
    const status = /duplicate|unique/i.test(msg) ? 409 : 500;
    return { ok: false, error: msg, status };
  }

  const { error: memErr } = await input.admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: input.adminUserId,
    role: "admin",
  });

  if (memErr) {
    await input.admin.from("organizations").delete().eq("id", org.id);
    return {
      ok: false,
      error: memErr.message ?? "Could not add organization admin",
      status: 500,
    };
  }

  return { ok: true, organizationId: org.id as string };
}

// ---------------------------------------------------------------------------
// Organization member role patch
// ---------------------------------------------------------------------------

const ALLOWED_MEMBER_ROLES: OrganizationMemberRole[] = ["admin", "member"];

export async function patchOrganizationMemberRoleForUser(input: {
  supabase: SupabaseClient;
  membershipId: string;
  role: string;
}): Promise<
  | { ok: true; membership: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  if (typeof input.role !== "string" || !ALLOWED_MEMBER_ROLES.includes(input.role as OrganizationMemberRole)) {
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

// ---------------------------------------------------------------------------
// Invite / resolve user by email
// ---------------------------------------------------------------------------

export function inviteRedirectTo(): string | undefined {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (!base) return undefined;
  const clean = base.replace(/\/$/, "");
  return `${clean}/login`;
}

export async function resolveUserIdByEmail(
  admin: AdminClient,
  emailLower: string,
): Promise<{ userId: string | null; invited: boolean; error?: string }> {
  const { data: profileRow, error: pErr } = await admin
    .from("profiles")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();

  if (pErr) {
    return { userId: null, invited: false, error: pErr.message };
  }
  if (profileRow?.id) {
    return { userId: profileRow.id as string, invited: false };
  }

  const redirectTo = inviteRedirectTo();
  const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(
    emailLower,
    redirectTo ? { redirectTo } : undefined,
  );
  if (!invErr && inv.user?.id) {
    return { userId: inv.user.id, invited: true };
  }

  const msg = invErr?.message?.toLowerCase() ?? "";
  const already =
    msg.includes("already") || msg.includes("registered") || msg.includes("exists");
  if (!already) {
    return { userId: null, invited: false, error: invErr?.message ?? "Could not invite user" };
  }

  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 25; i++) {
    const { data: pageData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
    if (listErr) {
      return { userId: null, invited: false, error: listErr.message };
    }
    const users = pageData?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === emailLower);
    if (found?.id) {
      return { userId: found.id, invited: false };
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return {
    userId: null,
    invited: false,
    error:
      "User exists but could not be resolved; try a smaller user directory or add them after they sign up.",
  };
}

// ---------------------------------------------------------------------------
// Invite or add organization member
// ---------------------------------------------------------------------------

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
