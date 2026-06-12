import { createClient } from "@/lib/supabase/client";
import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch, parseEdgeJson } from "@/lib/supabase/edge-functions";
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
// Organization image (public URL only in browser; path I/O via Edge)
// ---------------------------------------------------------------------------

export function getOrgImagePublicUrlBrowser(path: string | null | undefined): string | null {
  return getOrgImagePublicUrl(createClient(), path);
}

export async function fetchOrganizationImagePath(organizationId: string): Promise<string | null> {
  const params = new URLSearchParams({ organization_id: organizationId });
  const { path } = await parseEdgeJson<{ path: string | null }>(
    await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.organizations.imageGet}?${params}`),
  );
  return path?.trim() || null;
}

export async function uploadOrganizationImageAndSetPath(input: {
  organizationId: string;
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const formData = new FormData();
  formData.set("organization_id", input.organizationId);
  formData.set("file", input.file);
  if (input.previousPath?.trim()) {
    formData.set("previousPath", input.previousPath.trim());
  }
  const data = await parseEdgeJson<{ path?: string }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.imageUpload, {
      method: "POST",
      body: formData,
    }),
  );
  if (!data.path) throw new Error("Missing path in response");
  return data.path;
}

export async function clearOrganizationImagePathAndRemoveStorage(input: {
  organizationId: string;
  storagePath: string;
}): Promise<{ storageRemoved: boolean }> {
  return parseEdgeJson<{ storageRemoved: boolean }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.imageDelete, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: input.organizationId,
        storagePath: input.storagePath,
      }),
    }),
  );
}

// ---------------------------------------------------------------------------
// Organization membership list (same shape as server layout bootstrap)
// ---------------------------------------------------------------------------

export async function fetchOrganizationMembershipRows(_input: {
  userId: string;
  isSuperAdmin: boolean;
}): Promise<OrgMembershipRow[]> {
  const { memberships } = await parseEdgeJson<{ memberships: OrgMembershipRow[] }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.listMemberships),
  );
  return memberships;
}

// ---------------------------------------------------------------------------
// Tenant metrics / members / settings
// ---------------------------------------------------------------------------

export async function fetchOrganizationMetricsBrowser(organizationId: string) {
  const params = new URLSearchParams({ organization_id: organizationId });
  const { metrics } = await parseEdgeJson<{
    metrics: { trackingRequests: number | null; shipments: number | null; members: number | null };
  }>(await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.organizations.metrics}?${params}`));
  return metrics;
}

export async function fetchOrganizationMemberRowsBrowser(organizationId: string): Promise<OrgMemberRow[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  const { members } = await parseEdgeJson<{ members: OrgMemberRow[] }>(
    await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.organizations.members}?${params}`),
  );
  return members;
}

export async function updateOrganizationNameAndSlugBrowser(
  organizationId: string,
  name: string,
  slug: string,
): Promise<void> {
  await parseEdgeJson<{ ok: true }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.updateSettings, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: organizationId, name, slug }),
    }),
  );
}

export async function deleteOrganizationMemberByIdBrowser(membershipId: string): Promise<void> {
  await parseEdgeJson<{ ok: true }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.deleteMember, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membership_id: membershipId }),
    }),
  );
}

// ---------------------------------------------------------------------------
// Organization members (Edge)
// ---------------------------------------------------------------------------

export async function patchOrganizationMemberRole(
  membershipId: string,
  role: OrganizationMemberRole,
): Promise<OrganizationMemberRecord> {
  const data = await parseEdgeJson<{ membership?: OrganizationMemberRecord }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.patchMember, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membership_id: membershipId, role }),
    }),
  );
  if (!data.membership) throw new Error("Missing membership in response");
  return data.membership;
}

export async function inviteOrganizationMember(input: {
  organization_id: string;
  email: string;
  role: OrganizationMemberRole;
}): Promise<{ membership: { id: string }; invited: boolean }> {
  return parseEdgeJson<{ membership: { id: string }; invited: boolean }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.inviteMember, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: input.organization_id,
        email: input.email.trim().toLowerCase(),
        role: input.role,
      }),
    }),
  );
}

// ---------------------------------------------------------------------------
// Create organization (Edge)
// ---------------------------------------------------------------------------

export async function createOrganization(input: {
  name: string;
  slug: string | null;
  initialAdminEmail?: string | null;
}): Promise<{ id: string }> {
  const data = await parseEdgeJson<{ id?: string }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name.trim(),
        slug: input.slug?.trim() || null,
        initial_admin_email: input.initialAdminEmail?.trim().toLowerCase() || null,
      }),
    }),
  );
  if (!data.id) throw new Error("Missing organization id");
  return { id: data.id };
}

// ---------------------------------------------------------------------------
// Admin org directory (Edge)
// ---------------------------------------------------------------------------

export async function fetchAdminOrgMemberDirectoryRows(): Promise<AdminOrgMemberRow[]> {
  const { rows } = await parseEdgeJson<{ rows: AdminOrgMemberRow[] }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.adminMemberDirectory),
  );
  return rows;
}

export type PendingAccessRequestRow = {
  id: string;
  shipment_id: string;
  requester_email: string;
  order_number: string | null;
  requested_at: string;
};

export type CustomerDirectoryRow = {
  email: string;
  display_name: string | null;
  active_shipment_count: number;
  pending_invite_count: number;
  pending_request_count: number;
  last_activity_at: string | null;
};

export async function fetchPendingAccessRequestsBrowser(
  organizationId: string,
): Promise<PendingAccessRequestRow[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  const { rows } = await parseEdgeJson<{ rows: PendingAccessRequestRow[] }>(
    await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.organizations.pendingAccessRequests}?${params}`),
  );
  return rows ?? [];
}

export async function fetchCustomerDirectoryBrowser(
  organizationId: string,
): Promise<CustomerDirectoryRow[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  const { rows } = await parseEdgeJson<{ rows: CustomerDirectoryRow[] }>(
    await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.organizations.customerDirectory}?${params}`),
  );
  return rows ?? [];
}
