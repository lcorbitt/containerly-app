import type { LoginFormMode } from "../LoginForm/types";

export interface LoginPageProps {
  initialMode: LoginFormMode;
  next: string;
}
