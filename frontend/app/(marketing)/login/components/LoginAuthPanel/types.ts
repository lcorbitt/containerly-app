import type { LoginFormMode } from "../LoginForm/types";

export interface LoginAuthPanelProps {
  initialMode: LoginFormMode;
  next: string;
}
