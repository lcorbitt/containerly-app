export interface SignupAccountStepProps {
  onContinue: () => void | Promise<void>;
  onBack: () => void;
  initialError?: string | null;
}
