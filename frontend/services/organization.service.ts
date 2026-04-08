import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/utils/api-client";
import { readApiJson } from "@/utils/json-api";
import type { OrganizationMemberRole } from "@/types/database";
import type { OrgMembershipRow } from "@/types/organization-workspace";
import type {
  AdminOrgMemberRow,
  OrgMemberRow,
  OrganizationMemberRecord,
} from "@/types/organization-directory";
import { getOrgImagePublicUrl } from "@/utils/org-image";

export type { AdminOrgMemberRow, OrgMemberRow, OrganizationMemberRecord };

// ---------------------------------------------------------------------------
// Organization image (public URL only in browser; path I/O via /api)
// ---------------------------------------------------------------------------

export function getOrgImagePublicUrlBrowser(path: string | null | undefined): string | null {
  return getOrgImagePublicUrl(createClient(), path);
}

export async function fetchOrganizationImagePath(organizationId: string): Promise<string | null> {
  const { path } = await apiJson<{ path: string | null }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/org-image`,
  );
  return path?.trim() || null;
}

export async function uploadOrganizationImageAndSetPath(input: {
  organizationId: string;
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const formData = new FormData();
  formData.set("file", input.file);
  if (input.previousPath?.trim()) {
    formData.set("previousPath", input.previousPath.trim());
  }
  const res = await fetch(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/org-image`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    },
  );
  const data = await readApiJson<{ path?: string }>(res);
  if (!data.path) throw new Error("Missing path in response");
  return data.path;
}

export async function clearOrganizationImagePathAndRemoveStorage(input: {
  organizationId: string;
  storagePath: string;
}): Promise<{ storageRemoved: boolean }> {
  return apiJson<{ storageRemoved: boolean }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/org-image`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storagePath: input.storagePath }),
    },
  );
}

// ---------------------------------------------------------------------------
// Organization membership list (same shape as server layout bootstrap)
// ---------------------------------------------------------------------------

export async function fetchOrganizationMembershipRows(_input: {
  userId: string;
  isSuperAdmin: boolean;
}): Promise<OrgMembershipRow[]> {
  const { memberships } = await apiJson<{ memberships: OrgMembershipRow[] }>("/api/me/org-memberships");
  return memberships;
}

// ---------------------------------------------------------------------------
// Tenant metrics / members / settings
// ---------------------------------------------------------------------------

export async function fetchOrganizationMetricsBrowser(organizationId: string) {
  const { metrics } = await apiJson<{
    metrics: { trackingRequests: number | null; shipments: number | null; members: number | null };
  }>(`/api/organizations/${encodeURIComponent(organizationId)}/metrics`);
  return metrics;
}

export async function fetchOrganizationMemberRowsBrowser(organizationId: string): Promise<OrgMemberRow[]> {
  const { members } = await apiJson<{ members: OrgMemberRow[] }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/members`,
  );
  return members;
}

export async function updateOrganizationNameAndSlugBrowser(
  organizationId: string,
  name: string,
  slug: string,
): Promise<void> {
  await apiJson(`/api/organizations/${encodeURIComponent(organizationId)}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug }),
  });
}

export async function deleteOrganizationMemberByIdBrowser(membershipId: string): Promise<void> {
  await apiJson(`/api/organization-members/${encodeURIComponent(membershipId)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Organization members (API)
// ---------------------------------------------------------------------------

export async function patchOrganizationMemberRole(
  membershipId: string,
  role: OrganizationMemberRole,
): Promise<OrganizationMemberRecord> {
  const data = await apiJson<{ membership?: OrganizationMemberRecord }>(
    `/api/organization-members/${encodeURIComponent(membershipId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  if (!data.membership) throw new Error("Missing membership in response");
  return data.membership;
}

export async function inviteOrganizationMember(input: {
  organization_id: string;
  email: string;
  role: OrganizationMemberRole;
}): Promise<{ membership: { id: string }; invited: boolean }> {
  return apiJson("/api/organization-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: input.organization_id,
      email: input.email.trim().toLowerCase(),
      role: input.role,
    }),
  });
}

// ---------------------------------------------------------------------------
// Create organization (API)
// ---------------------------------------------------------------------------

export async function createOrganization(input: {
  name: string;
  slug: string | null;
}): Promise<{ id: string }> {
  const data = await apiJson<{ id?: string }>("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      slug: input.slug?.trim() || null,
    }),
  });
  if (!data.id) throw new Error("Missing organization id");
  return { id: data.id };
}

// ---------------------------------------------------------------------------
// Admin org directory (API)
// ---------------------------------------------------------------------------

export async function fetchAdminOrgMemberDirectoryRows(): Promise<AdminOrgMemberRow[]> {
  const { rows } = await apiJson<{ rows: AdminOrgMemberRow[] }>("/api/admin/org-member-directory");
  return rows;
}
