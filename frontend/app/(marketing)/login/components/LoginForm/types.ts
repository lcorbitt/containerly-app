export type LoginFormMode = "signin" | "signup";

export interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  mode: LoginFormMode;
  message: string | null;
  loading: boolean;
  loadingTitle: string;
  loadingSubtitle: string | null;
  submit: (event: React.FormEvent) => void;
}
