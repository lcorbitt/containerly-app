import { LOGIN_AUTH_PANEL_CARD_CLASS } from "@/app/(marketing)/login/components/LoginAuthPanel/constants";

export const SIGNUP_WIZARD_CARD_CLASS = LOGIN_AUTH_PANEL_CARD_CLASS;

export const SIGNUP_WIZARD_PROGRESS_CLASS = "mb-6 flex items-center justify-center gap-2";

export const SIGNUP_WIZARD_STEP_DOT_BASE_CLASS =
  "h-2 w-2 rounded-full transition-colors";

export const SIGNUP_WIZARD_STEP_DOT_ACTIVE_CLASS = "bg-primary-orange";

export const SIGNUP_WIZARD_STEP_DOT_INACTIVE_CLASS = "bg-zinc-300 dark:bg-zinc-600";

export const SIGNUP_WIZARD_STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: "Create an Account",
  2: "Name Your Team",
  3: "Invite Your Team",
};

export const SIGNUP_WIZARD_NEXT_LABEL = "Next";

export const SIGNUP_WIZARD_NEXT_LOADING_LABEL = "Continuing…";
