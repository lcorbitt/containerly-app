import type { SupabaseClient } from "@supabase/supabase-js";

export interface PendingTenantInviteSummary {
  id: string;
  suggestedOrgName: string | null;
}

export interface OnboardingStatusResult {
  hasOrgMembership: boolean;
  organizationId: string | null;
  pendingTenantInvite: PendingTenantInviteSummary | null;
}

interface OnboardingStatusRpcRow {
  has_org_membership?: boolean;
  organization_id?: string | null;
  pending_tenant_invite?: {
    id?: string;
    suggested_org_name?: string | null;
  } | null;
}

function mapPendingInvite(
  raw: OnboardingStatusRpcRow["pending_tenant_invite"],
): PendingTenantInviteSummary | null {
  if (!raw?.id) return null;
  return {
    id: raw.id,
    suggestedOrgName: raw.suggested_org_name ?? null,
  };
}

export async function fetchOnboardingStatusForUser(
  supabase: SupabaseClient,
): Promise<OnboardingStatusResult> {
  const { data, error } = await supabase.rpc("get_onboarding_status");
  if (error) throw new Error(error.message);

  const row = (data ?? {}) as OnboardingStatusRpcRow;
  return {
    hasOrgMembership: Boolean(row.has_org_membership),
    organizationId: (row.organization_id as string | null) ?? null,
    pendingTenantInvite: mapPendingInvite(row.pending_tenant_invite ?? null),
  };
}
