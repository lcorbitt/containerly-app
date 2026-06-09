export interface ForgotPasswordFormProps {
  email: string;
  setEmail: (value: string) => void;
  message: string | null;
  submitted: boolean;
  loading: boolean;
  submit: (event: React.FormEvent) => void;
}
