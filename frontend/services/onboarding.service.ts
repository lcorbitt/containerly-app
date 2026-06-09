import { apiJson } from "@/utils/api-client";
import type {
  AdminTenantInviteRow,
  PendingTenantInviteSummary,
} from "@/types/platform-tenant-invite";

export interface OnboardingStatusResponse {
  hasOrgMembership: boolean;
  pendingTenantInvite: PendingTenantInviteSummary | null;
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatusResponse> {
  return apiJson<OnboardingStatusResponse>("/api/onboarding/status");
}

export async function createOnboardingOrganization(input: {
  name: string;
  slug: string | null;
}): Promise<{ id: string }> {
  const data = await apiJson<{ id?: string }>("/api/onboarding/create-organization", {
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

export async function createAdminTenantInvite(input: {
  email: string;
  suggestedOrgName?: string | null;
}): Promise<{ inviteId: string; invited: boolean }> {
  return apiJson<{ inviteId: string; invited: boolean }>("/api/admin/tenant-invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      suggested_org_name: input.suggestedOrgName?.trim() || null,
    }),
  });
}

export async function fetchAdminTenantInviteRows(): Promise<AdminTenantInviteRow[]> {
  const { rows } = await apiJson<{ rows: AdminTenantInviteRow[] }>("/api/admin/tenant-invites");
  return rows ?? [];
}
