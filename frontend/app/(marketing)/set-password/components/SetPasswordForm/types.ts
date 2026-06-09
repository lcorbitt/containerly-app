export type SetPasswordFlow = "invite" | "recovery";

export interface SetPasswordFormProps {
  flow: SetPasswordFlow;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  message: string | null;
  loading: boolean;
  needsAuth: boolean;
  submit: (event: React.FormEvent) => void;
}
