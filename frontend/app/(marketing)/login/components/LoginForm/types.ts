export interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  message: string | null;
  loading: boolean;
  loadingTitle: string;
  submit: (event: React.FormEvent) => void;
}
