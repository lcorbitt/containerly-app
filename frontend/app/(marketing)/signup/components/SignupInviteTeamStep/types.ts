import type { SignupInviteDraft } from "../SignupWizard/types";

export interface SignupInviteTeamStepProps {
  onSubmit: (invites: SignupInviteDraft[]) => void | Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export interface SignupInviteRow {
  id: string;
  email: string;
  role: "admin" | "member";
}
