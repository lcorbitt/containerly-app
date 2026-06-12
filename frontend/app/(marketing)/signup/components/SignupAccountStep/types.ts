export interface SignupAccountStepProps {
  onContinue: () => void | Promise<void>;
  onSessionReady?: () => void;
  initialError?: string | null;
}
