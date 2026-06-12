import type { PendingTenantInviteSummary } from "@/types/platform-tenant-invite";

export interface SignupOrganizationStepProps {
  pendingInvite: PendingTenantInviteSummary | null;
  onComplete: (organizationId: string) => void;
}
