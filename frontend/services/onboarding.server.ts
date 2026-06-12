import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PendingTenantInviteSummary } from "@/types/platform-tenant-invite";

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

interface CompleteSignupOrganizationRpcRow {
  id?: string;
  invite_id?: string | null;
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

export async function completeSignupOrganizationForUser(
  supabase: SupabaseClient,
  input: {
    name: string;
    slug: string | null;
    teamSize?: string | null;
    monthlyShipmentVolume?: string | null;
  },
): Promise<{ organizationId: string; inviteId: string | null }> {
  const { data, error } = await supabase.rpc("complete_signup_organization", {
    p_name: input.name.trim(),
    p_slug: input.slug?.trim() || null,
    p_team_size: input.teamSize?.trim() || null,
    p_monthly_shipment_volume: input.monthlyShipmentVolume?.trim() || null,
  });
  if (error) throw new Error(error.message);

  const row = (data ?? {}) as CompleteSignupOrganizationRpcRow;
  if (!row.id) throw new Error("Missing organization id");
  return {
    organizationId: row.id,
    inviteId: (row.invite_id as string | null) ?? null,
  };
}
