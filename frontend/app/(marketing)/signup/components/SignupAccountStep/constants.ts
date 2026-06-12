import {
  SIGNUP_WIZARD_NEXT_LABEL,
  SIGNUP_WIZARD_NEXT_LOADING_LABEL,
} from "../SignupWizard/constants";

export const SIGNUP_ACCOUNT_REFERRAL_OPTIONS = [
  { value: "", label: "Select an Option" },
  { value: "google_search", label: "Google Search" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "social_media", label: "Social Media" },
  { value: "referral", label: "Referral" },
  { value: "trade_show", label: "Trade Show / Event" },
  { value: "other", label: "Other" },
] as const;

export const SIGNUP_ACCOUNT_REFERRAL_OTHER_LABEL = "Please Specify";

export const SIGNUP_ACCOUNT_SUBMIT_LABEL = SIGNUP_WIZARD_NEXT_LABEL;

export const SIGNUP_ACCOUNT_LOADING_TITLE = SIGNUP_WIZARD_NEXT_LOADING_LABEL;

export const SIGNUP_ACCOUNT_LOADING_SUBTITLE = "Setting up your account.";

export const SIGNUP_ACCOUNT_SIGN_IN_PROMPT = "Already have an account?";

export const SIGNUP_ACCOUNT_SIGN_IN_LABEL = "Sign In";

export const SIGNUP_ACCOUNT_SELECT_CLASS =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-[border-color,box-shadow] focus:border-primary-orange/45 focus:outline-none focus:ring-2 focus:ring-primary-orange/15 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-primary-orange/55 dark:focus:ring-primary-orange/20";

export const SIGNUP_ACCOUNT_FIELD_LABEL_CLASS =
  "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";
