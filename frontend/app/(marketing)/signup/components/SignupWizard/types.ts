export type SignupWizardStep = 1 | 2 | 3;

export interface SignupWizardProps {
  initialStep: SignupWizardStep;
  initialError?: string | null;
}
