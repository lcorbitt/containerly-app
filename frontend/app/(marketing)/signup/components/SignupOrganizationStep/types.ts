import type { PendingTenantInviteSummary } from "@/types/platform-tenant-invite";

export interface SignupOrganizationStepProps {
  pendingInvite: PendingTenantInviteSummary | null;
  organizationId: string | null;
  onOrganizationIdReady: (organizationId: string) => void;
  onComplete: (organizationId: string) => void;
  onBack: () => void;
}
