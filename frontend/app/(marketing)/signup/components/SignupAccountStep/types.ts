export interface SignupAccountStepProps {
  onContinue: () => void | Promise<void>;
  initialError?: string | null;
}
