import type { OrganizationMemberRole } from "@/types/database";

export type SignupWizardStep = 1 | 2 | 3;

export interface SignupWizardProps {
  initialStep: SignupWizardStep;
  initialError?: string | null;
}

export interface SignupAccountDraft {
  fullName: string;
  email: string;
  password: string;
  referralSource: string;
}

export interface SignupOrganizationDraft {
  name: string;
  teamSize: string;
  monthlyShipmentVolume: string;
}

export interface SignupInviteDraft {
  email: string;
  role: OrganizationMemberRole;
}

export interface SignupDraft {
  account: SignupAccountDraft | null;
  organization: SignupOrganizationDraft | null;
  invites: SignupInviteDraft[];
}
