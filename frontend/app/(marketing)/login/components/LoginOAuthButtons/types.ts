export interface LoginOAuthButtonsProps {
  next: string;
  disabled?: boolean;
  initialError?: string | null;
}

export type OAuthButtonProvider = "google" | "azure";
