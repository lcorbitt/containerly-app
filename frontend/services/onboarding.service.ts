import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch, parseEdgeJson } from "@/lib/supabase/edge-functions";
import type {
  AdminTenantInviteRow,
  PendingTenantInviteSummary,
} from "@/types/platform-tenant-invite";

export interface OnboardingStatusResponse {
  hasOrgMembership: boolean;
  organizationId: string | null;
  pendingTenantInvite: PendingTenantInviteSummary | null;
}

export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  return parseEdgeJson<OnboardingStatusResponse>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.onboarding.status),
  );
}

export async function completeOnboardingOrganization(input: {
  name: string;
  slug: string | null;
  teamSize?: string | null;
  monthlyShipmentVolume?: string | null;
}): Promise<{ id: string }> {
  const data = await parseEdgeJson<{ id?: string }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.onboarding.completeOrganization, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name.trim(),
        slug: input.slug?.trim() || null,
        team_size: input.teamSize?.trim() || null,
        monthly_shipment_volume: input.monthlyShipmentVolume?.trim() || null,
      }),
    }),
  );
  if (!data.id) throw new Error("Missing organization id");
  return { id: data.id };
}

export async function createTenantInvite(input: {
  email: string;
  suggestedOrgName?: string | null;
}): Promise<{ inviteId: string; invited: boolean }> {
  return parseEdgeJson<{ inviteId: string; invited: boolean }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.tenantInvites.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        suggested_org_name: input.suggestedOrgName?.trim() || null,
      }),
    }),
  );
}

export async function listTenantInvites(): Promise<AdminTenantInviteRow[]> {
  const { rows } = await parseEdgeJson<{ rows: AdminTenantInviteRow[] }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.tenantInvites.list),
  );
  return rows ?? [];
}
