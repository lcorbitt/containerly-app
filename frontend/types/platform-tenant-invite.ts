export type PlatformTenantInviteStatus = "pending" | "accepted" | "revoked";

export interface PlatformTenantInviteRow {
  id: string;
  email: string;
  email_lower: string;
  suggested_org_name: string | null;
  invited_by_user_id: string;
  status: PlatformTenantInviteStatus;
  user_id: string | null;
  organization_id: string | null;
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
}

export interface PendingTenantInviteSummary {
  id: string;
  suggestedOrgName: string | null;
}

export interface AdminTenantInviteRow {
  id: string;
  email: string;
  suggestedOrgName: string | null;
  status: PlatformTenantInviteStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}
