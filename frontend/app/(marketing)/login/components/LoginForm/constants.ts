import {
  PRIMARY_ORANGE_BUTTON_CLASS,
  PRIMARY_ORANGE_BUTTON_INNER_CLASS,
} from "@/constants/primary-orange-button";

export const LOGIN_FORM_BLURRED_CONTENT_CLASS =
  "pointer-events-none opacity-55 blur-[1.5px] transition-[filter,opacity]";

export const LOGIN_FORM_LOADING_OVERLAY_CLASS =
  "absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/75 p-6 backdrop-blur-[2px] dark:bg-zinc-950/75";

export const LOGIN_FORM_LOADING_CARD_CLASS =
  "flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-5 py-5 text-center shadow-lg dark:border-white/10 dark:bg-zinc-950/90";

export const LOGIN_FORM_LOADING_TITLE_SIGN_IN = "Signing in…";

export const LOGIN_FORM_SHELL_CLASS = "relative w-full";

export const LOGIN_FORM_TITLE_CLASS =
  "text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50";

export const LOGIN_FORM_FIELDS_CLASS = "mt-6 flex flex-col gap-3";

export const LOGIN_FORM_FIELD_GROUP_CLASS = "relative";

export const LOGIN_FORM_FIELD_ICON_CLASS =
  "pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500";

export const LOGIN_FORM_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white py-0 pl-10 pr-4 text-sm text-zinc-900 transition-[border-color,box-shadow,background-color,color] placeholder:text-zinc-400 focus:border-primary-orange/45 focus:outline-none focus:ring-2 focus:ring-primary-orange/15 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-orange/55 dark:focus:ring-primary-orange/20";

export const LOGIN_FORM_PASSWORD_TOGGLE_CLASS =
  "absolute right-3 top-1/2 z-[1] -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300";

export const LOGIN_FORM_MESSAGE_CLASS =
  "text-sm text-zinc-600 dark:text-zinc-400";

export const LOGIN_FORM_SUBMIT_CLASS = `${PRIMARY_ORANGE_BUTTON_CLASS} inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-white transition-[opacity,transform] active:scale-[0.99] disabled:cursor-wait disabled:opacity-90`;

export const LOGIN_FORM_SUBMIT_INNER_CLASS = PRIMARY_ORANGE_BUTTON_INNER_CLASS;

export const LOGIN_FORM_FOOTER_CLASS = "mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400";

export const LOGIN_FORM_FOOTER_LINK_CLASS =
  "underline-offset-2 transition-colors hover:text-primary-orange hover:underline dark:text-zinc-300";

export const LOGIN_FORM_FORGOT_PASSWORD_LINK_CLASS =
  "text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-primary-orange hover:underline dark:text-zinc-400";

export const LOGIN_FORM_FORGOT_PASSWORD_LABEL = "Forgot Password?";
