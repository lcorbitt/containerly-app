import type { SupabaseClient } from "@supabase/supabase-js";
import { inviteRedirectTo } from "@shared/auth-redirect.ts";
import { deriveOrgMemberInviteStatus } from "@shared/org-member-invite-status.ts";
import { assertOrgImageFile, buildOrgImageObjectPath, ORG_IMAGES_BUCKET } from "@shared/org-image.ts";
import { parseOrgPerformanceSettings } from "@shared/org-performance-settings.ts";
import { slugFromOrganizationName } from "@shared/organization-slug.ts";
import { isSuperadminRole } from "@shared/profile-role.ts";
import { fetchProfileRole } from "@models/profiles.ts";
import type { OrgPerformanceSettings } from "@shared/dto/performance.dto.ts";

const ALLOWED_MEMBER_ROLES = new Set(["admin", "member"]);

export interface OrgMembershipRow {
  role: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
    org_image_path: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface OrgMemberRow {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export interface AdminOrgMemberRow {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  inviteStatus: "pending" | "accepted" | "direct";
  invitedAt: string | null;
  acceptedAt: string | null;
}

export async function fetchOrgMembershipRows(
  supabase: SupabaseClient,
  userId: string,
  isSuperAdmin: boolean,
): Promise<OrgMembershipRow[]> {
  if (isSuperAdmin) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, org_image_path, created_at, updated_at")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((o) => ({
      role: "platform",
      organizations: o as OrgMembershipRow["organizations"],
    }));
  }
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug, org_image_path, created_at, updated_at)")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const o = row.organizations;
    const org = Array.isArray(o) ? o[0] : o;
    return { role: row.role as string, organizations: (org ?? null) as OrgMembershipRow["organizations"] };
  });
}

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

export async function fetchOrganizationPerformanceSettings(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgPerformanceSettings> {
  const { data, error } = await supabase
    .from("organizations")
    .select("performance_settings")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return parseOrgPerformanceSettings(data?.performance_settings);
}

export async function updateOrganizationPerformanceSettings(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    settings: OrgPerformanceSettings;
  },
): Promise<OrgPerformanceSettings> {
  const normalized = parseOrgPerformanceSettings(input.settings);
  const { error } = await supabase
    .from("organizations")
    .update({ performance_settings: normalized })
    .eq("id", input.organizationId);
  if (error) throw new Error(error.message);
  return normalized;
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
      role: m.role as string,
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

export async function fetchOrganizationImagePathQuery(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("org_image_path")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.org_image_path as string | null | undefined) ?? null)?.trim() || null;
}

export async function uploadOrganizationImageAndSetPath(
  supabase: SupabaseClient,
  input: { organizationId: string; file: File; previousPath: string | null },
): Promise<string> {
  assertOrgImageFile({ size: input.file.size, type: input.file.type });
  const objectPath = buildOrgImageObjectPath(input.organizationId, input.file);
  const { error: upErr } = await supabase.storage
    .from(ORG_IMAGES_BUCKET)
    .upload(objectPath, input.file, {
      contentType: input.file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { error: dbErr } = await supabase
    .from("organizations")
    .update({ org_image_path: objectPath })
    .eq("id", input.organizationId);
  if (dbErr) {
    await supabase.storage.from(ORG_IMAGES_BUCKET).remove([objectPath]);
    throw new Error(dbErr.message);
  }

  if (input.previousPath?.trim()) {
    await supabase.storage.from(ORG_IMAGES_BUCKET).remove([input.previousPath.trim()]);
  }
  return objectPath;
}

export async function clearOrganizationImagePath(
  supabase: SupabaseClient,
  input: { organizationId: string; storagePath: string },
): Promise<{ storageRemoved: boolean }> {
  const { error: dbErr } = await supabase
    .from("organizations")
    .update({ org_image_path: null })
    .eq("id", input.organizationId);
  if (dbErr) throw new Error(dbErr.message);

  const { error: rmErr } = await supabase.storage.from(ORG_IMAGES_BUCKET).remove([input.storagePath]);
  return { storageRemoved: !rmErr };
}

export async function createOrganizationWithInitialAdmin(input: {
  admin: SupabaseClient;
  name: string;
  slugInput: string | null;
  adminUserId: string;
  teamSize?: string | null;
  monthlyShipmentVolume?: string | null;
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

  const teamSize =
    typeof input.teamSize === "string" && input.teamSize.trim() !== ""
      ? input.teamSize.trim()
      : null;
  const monthlyShipmentVolume =
    typeof input.monthlyShipmentVolume === "string" && input.monthlyShipmentVolume.trim() !== ""
      ? input.monthlyShipmentVolume.trim()
      : null;

  const { data: org, error: orgErr } = await input.admin
    .from("organizations")
    .insert({
      name,
      slug: slugFinal,
      team_size: teamSize,
      monthly_shipment_volume: monthlyShipmentVolume,
    })
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

export async function patchOrganizationMemberRoleForUser(input: {
  supabase: SupabaseClient;
  membershipId: string;
  role: string;
}): Promise<
  | { ok: true; membership: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  if (typeof input.role !== "string" || !ALLOWED_MEMBER_ROLES.has(input.role)) {
    return { ok: false, error: "Invalid role", status: 400 };
  }

  const { data, error } = await input.supabase
    .from("organization_members")
    .update({ role: input.role })
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

export async function resolveUserIdByEmail(
  admin: SupabaseClient,
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

export async function inviteOrAddOrganizationMember(input: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  actingUserId: string;
  organizationId: string;
  emailLower: string;
  role: string;
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
  if (!ALLOWED_MEMBER_ROLES.has(input.role)) {
    return { ok: false, error: "Invalid role", status: 400 };
  }

  const { data: sessionProfile } = await fetchProfileRole(input.supabase, input.actingUserId);

  if (!isSuperadminRole(sessionProfile?.role as string | undefined)) {
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

export type PendingAccessRequestRow = {
  id: string;
  shipment_id: string;
  requester_email: string;
  order_number: string | null;
  requested_at: string;
};

export async function fetchPendingAccessRequestsForOrganization(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<PendingAccessRequestRow[]> {
  const { data, error } = await supabase
    .from("shipment_customer_access_requests")
    .select("id, shipment_id, requester_email, requested_at, shipments(order_number)")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const ship = row.shipments;
    const shipment = Array.isArray(ship) ? ship[0] : ship;
    return {
      id: row.id as string,
      shipment_id: row.shipment_id as string,
      requester_email: row.requester_email as string,
      order_number: (shipment?.order_number as string | null) ?? null,
      requested_at: row.requested_at as string,
    };
  });
}

export type CustomerDirectoryRow = {
  email: string;
  display_name: string | null;
  active_shipment_count: number;
  pending_invite_count: number;
  pending_request_count: number;
  last_activity_at: string | null;
};

export async function fetchCustomerDirectoryForOrganization(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CustomerDirectoryRow[]> {
  const [accessRes, invitesRes, requestsRes] = await Promise.all([
    supabase
      .from("shipment_customer_access")
      .select("shipment_id, updated_at, profiles(email, full_name)")
      .eq("organization_id", organizationId)
      .is("revoked_at", null),
    supabase
      .from("customer_invites")
      .select("invited_email, shipment_id, created_at")
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("shipment_customer_access_requests")
      .select("requester_email, requested_at")
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
  ]);

  if (accessRes.error) throw new Error(accessRes.error.message);
  if (invitesRes.error) throw new Error(invitesRes.error.message);
  if (requestsRes.error) throw new Error(requestsRes.error.message);

  type Acc = {
    email: string;
    display_name: string | null;
    shipmentIds: Set<string>;
    pending_invite_count: number;
    pending_request_count: number;
    last_activity_at: string | null;
  };

  const byEmail = new Map<string, Acc>();

  const touch = (
    emailRaw: string,
    patch: Partial<Acc> & { activityAt?: string | null; shipmentId?: string | null },
  ) => {
    const email = emailRaw.trim().toLowerCase();
    if (!email) return;
    const existing = byEmail.get(email) ?? {
      email,
      display_name: null,
      shipmentIds: new Set<string>(),
      pending_invite_count: 0,
      pending_request_count: 0,
      last_activity_at: null,
    };
    if (patch.display_name?.trim()) {
      existing.display_name = patch.display_name.trim();
    }
    if (patch.pending_invite_count) {
      existing.pending_invite_count += patch.pending_invite_count;
    }
    if (patch.pending_request_count) {
      existing.pending_request_count += patch.pending_request_count;
    }
    if (patch.activityAt) {
      const prev = existing.last_activity_at ? Date.parse(existing.last_activity_at) : 0;
      const next = Date.parse(patch.activityAt);
      if (next > prev) existing.last_activity_at = patch.activityAt;
    }
    if (patch.shipmentId) {
      existing.shipmentIds.add(patch.shipmentId);
    }
    byEmail.set(email, existing);
  };

  for (const row of accessRes.data ?? []) {
    const profile = row.profiles;
    const p = Array.isArray(profile) ? profile[0] : profile;
    const email = (p?.email as string | null) ?? "";
    touch(email, {
      display_name: (p?.full_name as string | null) ?? null,
      activityAt: (row.updated_at as string | null) ?? null,
      shipmentId: row.shipment_id as string,
    });
  }

  for (const row of invitesRes.data ?? []) {
    touch(row.invited_email as string, {
      pending_invite_count: 1,
      activityAt: (row.created_at as string | null) ?? null,
      shipmentId: row.shipment_id as string,
    });
  }

  for (const row of requestsRes.data ?? []) {
    touch(row.requester_email as string, {
      pending_request_count: 1,
      activityAt: (row.requested_at as string | null) ?? null,
    });
  }

  return [...byEmail.values()]
    .map((row) => ({
      email: row.email,
      display_name: row.display_name,
      active_shipment_count: row.shipmentIds.size,
      pending_invite_count: row.pending_invite_count,
      pending_request_count: row.pending_request_count,
      last_activity_at: row.last_activity_at,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

type AuthInviteFields = {
  invitedAt: string | null;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
};

async function fetchAuthInviteFieldsByUserIds(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, AuthInviteFields>> {
  const map = new Map<string, AuthInviteFields>();
  const unique = [...new Set(userIds)];
  const chunkSize = 20;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (userId) => {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (error || !data.user) return;
        map.set(userId, {
          invitedAt: data.user.invited_at ?? null,
          emailConfirmedAt: data.user.email_confirmed_at ?? null,
          lastSignInAt: data.user.last_sign_in_at ?? null,
        });
      }),
    );
  }

  return map;
}

export async function fetchAdminOrgMemberDirectoryRows(
  supabase: SupabaseClient,
  admin: SupabaseClient,
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

  const authByUser = await fetchAuthInviteFieldsByUserIds(admin, userIds);

  return list.map((m) => {
    const o = m.organizations as { id: string; name: string } | { id: string; name: string }[] | null;
    const org = Array.isArray(o) ? o[0] : o;
    const prof = profileByUser.get(m.user_id);
    const auth = authByUser.get(m.user_id);
    const inviteFields = auth ?? {
      invitedAt: null,
      emailConfirmedAt: null,
      lastSignInAt: null,
    };
    const { status: inviteStatus, acceptedAt } = deriveOrgMemberInviteStatus(inviteFields);

    return {
      membershipId: m.id,
      organizationId: m.organization_id,
      organizationName: org?.name ?? "—",
      userId: m.user_id,
      fullName: prof?.fullName ?? null,
      email: prof?.email ?? null,
      role: m.role as string,
      createdAt: m.created_at,
      inviteStatus,
      invitedAt: inviteFields.invitedAt,
      acceptedAt,
    };
  });
}
