import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { readApiJson } from "@/utils/json-api";
import type { OrganizationMemberRole } from "@/types/database";
import type { OrgMembershipRow } from "@/types/organization-workspace";
import {
  ORG_IMAGES_BUCKET,
  buildOrgImageObjectPath,
  getOrgImagePublicUrl,
} from "@/utils/org-image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrgMemberRow = {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: OrganizationMemberRole;
  createdAt: string;
};

export type OrganizationMemberRecord = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  created_at: string;
};

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

// ---------------------------------------------------------------------------
// Organization image (browser)
// ---------------------------------------------------------------------------

export function getOrgImagePublicUrlBrowser(path: string | null | undefined): string | null {
  return getOrgImagePublicUrl(createClient(), path);
}

export async function fetchOrganizationImagePath(organizationId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("org_image_path")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.org_image_path as string | null | undefined) ?? null)?.trim() || null;
}

export async function uploadOrganizationImageAndSetPath(input: {
  organizationId: string;
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const supabase = createClient();
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

export async function clearOrganizationImagePathAndRemoveStorage(input: {
  organizationId: string;
  storagePath: string;
}): Promise<{ storageRemoved: boolean }> {
  const supabase = createClient();
  const { error: dbErr } = await supabase
    .from("organizations")
    .update({ org_image_path: null })
    .eq("id", input.organizationId);
  if (dbErr) throw new Error(dbErr.message);

  const { error: rmErr } = await supabase.storage.from(ORG_IMAGES_BUCKET).remove([input.storagePath]);
  return { storageRemoved: !rmErr };
}

// ---------------------------------------------------------------------------
// Organization membership
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Organization tenant (metrics, members, settings)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Organization members (API-backed)
// ---------------------------------------------------------------------------

export async function patchOrganizationMemberRole(
  membershipId: string,
  role: OrganizationMemberRole,
): Promise<OrganizationMemberRecord> {
  const res = await fetch(`/api/organization-members/${membershipId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const data = await readApiJson<{ membership?: OrganizationMemberRecord }>(res);
  if (!data.membership) throw new Error("Missing membership in response");
  return data.membership;
}

export async function inviteOrganizationMember(input: {
  organization_id: string;
  email: string;
  role: OrganizationMemberRole;
}): Promise<{ membership: { id: string }; invited: boolean }> {
  const res = await fetch("/api/organization-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: input.organization_id,
      email: input.email.trim().toLowerCase(),
      role: input.role,
    }),
  });
  return readApiJson<{ membership: { id: string }; invited: boolean }>(res);
}

// ---------------------------------------------------------------------------
// Create organization (API-backed)
// ---------------------------------------------------------------------------

export async function createOrganization(input: {
  name: string;
  slug: string | null;
}): Promise<{ id: string }> {
  const res = await fetch("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      slug: input.slug?.trim() || null,
    }),
  });
  const data = await readApiJson<{ id?: string }>(res);
  if (!data.id) throw new Error("Missing organization id");
  return { id: data.id };
}

// ---------------------------------------------------------------------------
// Admin org directory
// ---------------------------------------------------------------------------

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
