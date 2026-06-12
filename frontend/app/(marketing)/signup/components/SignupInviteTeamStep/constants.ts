import type { CustomSelectOption } from "@/components/CustomSelect";
import {
  SIGNUP_WIZARD_NEXT_LABEL,
  SIGNUP_WIZARD_NEXT_LOADING_LABEL,
} from "../SignupWizard/constants";

export const SIGNUP_INVITE_SKIP_LABEL = "Skip For Now";

export const SIGNUP_INVITE_NEXT_LABEL = SIGNUP_WIZARD_NEXT_LABEL;

export const SIGNUP_INVITE_NEXT_LOADING_LABEL = SIGNUP_WIZARD_NEXT_LOADING_LABEL;

export const SIGNUP_INVITE_ADD_PERSON_LABEL = "Add Another Person";

export const SIGNUP_INVITE_SKIP_BLURB =
  "You can invite team members later from Settings.";

export const SIGNUP_INVITE_EMAIL_LABEL = "Email Address";

export const SIGNUP_INVITE_ROLE_LABEL = "Role";

export const SIGNUP_INVITE_FIELD_LABEL_CLASS =
  "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

export const SIGNUP_INVITE_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-primary-orange/45 focus:outline-none focus:ring-2 focus:ring-primary-orange/15 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-orange/55 dark:focus:ring-primary-orange/20";

export const SIGNUP_INVITE_SELECT_SHELL_CLASS =
  "rounded-lg border border-zinc-200 bg-white disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 [&_button]:h-10 [&_button]:px-4 [&_button]:text-sm focus-within:border-primary-orange/45 focus-within:ring-2 focus-within:ring-primary-orange/15 dark:focus-within:border-primary-orange/55 dark:focus-within:ring-primary-orange/20";

export const SIGNUP_INVITE_ADD_BUTTON_CLASS =
  "text-sm font-medium text-primary-orange transition-colors hover:text-primary-orange/80";

export const SIGNUP_INVITE_SKIP_BUTTON_CLASS =
  "inline-flex h-10 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

export const SIGNUP_INVITE_ROLE_OPTIONS: CustomSelectOption[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];
