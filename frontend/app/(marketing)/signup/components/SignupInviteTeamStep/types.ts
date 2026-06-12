export interface SignupInviteTeamStepProps {
  organizationId: string | null;
  onSkip: () => void;
  onComplete: () => void;
}

export interface SignupInviteRow {
  id: string;
  email: string;
  role: "admin" | "member";
}
