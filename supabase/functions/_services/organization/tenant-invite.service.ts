import type { SupabaseClient } from "@supabase/supabase-js";
import { inviteRedirectTo } from "@shared/auth-redirect";
import {
  createOrganizationWithInitialAdmin,
} from "@services/organization/organization.service";

export interface AdminTenantInviteRow {
  id: string;
  email: string;
  suggestedOrgName: string | null;
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface PlatformTenantInviteRow {
  id: string;
  user_id: string | null;
  email_lower: string;
  status: string;
  expires_at: string;
}

export async function userHasOrganizationMembership(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { count, error } = await admin
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function fetchPendingTenantInviteByEmailLower(
  admin: SupabaseClient,
  emailLower: string,
): Promise<PlatformTenantInviteRow | null> {
  const { data, error } = await admin
    .from("platform_tenant_invites")
    .select("*")
    .eq("email_lower", emailLower)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PlatformTenantInviteRow | null) ?? null;
}

export async function listAdminTenantInviteRows(admin: SupabaseClient): Promise<AdminTenantInviteRow[]> {
  const { data, error } = await admin
    .from("platform_tenant_invites")
    .select("id, email, suggested_org_name, status, created_at, expires_at, accepted_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    suggestedOrgName: (row.suggested_org_name as string | null) ?? null,
    status: row.status as AdminTenantInviteRow["status"],
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    acceptedAt: (row.accepted_at as string | null) ?? null,
  }));
}

async function resolveAuthUserIdByEmail(
  admin: SupabaseClient,
  emailLower: string,
): Promise<{ userId: string | null; invited: boolean; error?: string }> {
  const { data: profileRow, error: pErr } = await admin
    .from("profiles")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();
  if (pErr) return { userId: null, invited: false, error: pErr.message };
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
    if (listErr) return { userId: null, invited: false, error: listErr.message };
    const users = pageData?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === emailLower);
    if (found?.id) return { userId: found.id, invited: false };
    if (users.length < perPage) break;
    page += 1;
  }

  return {
    userId: null,
    invited: false,
    error: "User exists but could not be resolved; try again later.",
  };
}

export async function createTenantInvite(input: {
  admin: SupabaseClient;
  actingUserId: string;
  emailLower: string;
  suggestedOrgName?: string | null;
}): Promise<
  | { ok: true; inviteId: string; invited: boolean }
  | { ok: false; error: string; status: number }
> {
  if (!input.emailLower.includes("@")) {
    return { ok: false, error: "Valid email is required", status: 400 };
  }

  const existingPending = await fetchPendingTenantInviteByEmailLower(input.admin, input.emailLower);
  if (existingPending) {
    return { ok: false, error: "A pending tenant invite already exists for this email", status: 409 };
  }

  const resolved = await resolveAuthUserIdByEmail(input.admin, input.emailLower);
  if (resolved.error || !resolved.userId) {
    return { ok: false, error: resolved.error ?? "Could not resolve user", status: 400 };
  }

  if (await userHasOrganizationMembership(input.admin, resolved.userId)) {
    return {
      ok: false,
      error: "This user already belongs to an organization",
      status: 409,
    };
  }

  const suggested =
    typeof input.suggestedOrgName === "string" && input.suggestedOrgName.trim() !== ""
      ? input.suggestedOrgName.trim()
      : null;

  const { data: inserted, error: insErr } = await input.admin
    .from("platform_tenant_invites")
    .insert({
      email: input.emailLower,
      email_lower: input.emailLower,
      suggested_org_name: suggested,
      invited_by_user_id: input.actingUserId,
      user_id: resolved.userId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insErr) {
    const dup = /duplicate|unique/i.test(insErr.message);
    return { ok: false, error: insErr.message, status: dup ? 409 : 500 };
  }

  return { ok: true, inviteId: inserted.id as string, invited: resolved.invited };
}

export async function completeOnboardingOrganization(input: {
  admin: SupabaseClient;
  userId: string;
  emailLower: string;
  name: string;
  slugInput: string | null;
  teamSize?: string | null;
  monthlyShipmentVolume?: string | null;
}): Promise<
  | { ok: true; organizationId: string; inviteId: string | null }
  | { ok: false; error: string; status: number }
> {
  if (await userHasOrganizationMembership(input.admin, input.userId)) {
    return { ok: false, error: "You already belong to an organization", status: 409 };
  }

  const pending = await fetchPendingTenantInviteByEmailLower(input.admin, input.emailLower);

  if (pending) {
    if (pending.user_id && pending.user_id !== input.userId) {
      return { ok: false, error: "Tenant invite is assigned to a different user", status: 403 };
    }
  }

  const orgResult = await createOrganizationWithInitialAdmin({
    admin: input.admin,
    name: input.name,
    slugInput: input.slugInput,
    adminUserId: input.userId,
    teamSize: input.teamSize,
    monthlyShipmentVolume: input.monthlyShipmentVolume,
  });

  if (!orgResult.ok) {
    return { ok: false, error: orgResult.error, status: orgResult.status };
  }

  if (!pending) {
    return {
      ok: true,
      organizationId: orgResult.organizationId,
      inviteId: null,
    };
  }

  const now = new Date().toISOString();
  const { error: updErr } = await input.admin
    .from("platform_tenant_invites")
    .update({
      status: "accepted",
      user_id: input.userId,
      organization_id: orgResult.organizationId,
      accepted_at: now,
    })
    .eq("id", pending.id)
    .eq("status", "pending");

  if (updErr) {
    return { ok: false, error: updErr.message, status: 500 };
  }

  return {
    ok: true,
    organizationId: orgResult.organizationId,
    inviteId: pending.id,
  };
}

/** Invite-only onboarding path — errors when no pending tenant invite. */
export async function completeTenantOnboardingOrganization(input: {
  admin: SupabaseClient;
  userId: string;
  emailLower: string;
  name: string;
  slugInput: string | null;
}): Promise<
  | { ok: true; organizationId: string; inviteId: string }
  | { ok: false; error: string; status: number }
> {
  const result = await completeOnboardingOrganization(input);
  if (!result.ok) return result;
  if (!result.inviteId) {
    return { ok: false, error: "No pending tenant invite found for your account", status: 403 };
  }
  return { ok: true, organizationId: result.organizationId, inviteId: result.inviteId };
}
