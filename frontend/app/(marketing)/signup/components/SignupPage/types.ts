import type { SignupWizardStep } from "../SignupWizard/types";

export interface SignupPageProps {
  initialStep: SignupWizardStep;
  initialError?: string | null;
}
