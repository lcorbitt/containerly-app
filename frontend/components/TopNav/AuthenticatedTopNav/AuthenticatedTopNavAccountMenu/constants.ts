import { AUTHENTICATED_TOP_NAV_UTILITY_BUTTON_HOVER_SURFACE_CLASS } from "../constants";

export const AUTHENTICATED_TOP_NAV_ACCOUNT_TRIGGER_CLASS = `relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/40 ${AUTHENTICATED_TOP_NAV_UTILITY_BUTTON_HOVER_SURFACE_CLASS}`;

export const AUTHENTICATED_TOP_NAV_ACCOUNT_AVATAR_CLASS =
  "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100";

export const AUTHENTICATED_TOP_NAV_ACCOUNT_PANEL_CLASS =
  "absolute right-0 top-full z-[200] mt-2 min-w-56 origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950";

export const AUTHENTICATED_TOP_NAV_ACCOUNT_HEADER_CLASS =
  "border-b border-zinc-100 p-4 dark:border-zinc-800";

export const AUTHENTICATED_TOP_NAV_ACCOUNT_ROLE_LABEL_CLASS =
  "mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400";

export const AUTHENTICATED_TOP_NAV_ACCOUNT_ITEM_CLASS =
  "w-full cursor-pointer rounded-bl-xl rounded-br-xl p-4 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-70 dark:text-zinc-200 dark:hover:bg-zinc-900";

export const AUTHENTICATED_TOP_NAV_ACCOUNT_LOGOUT_LABEL = "Log Out";

export const AUTHENTICATED_TOP_NAV_ACCOUNT_SIGNING_OUT_LABEL = "Signing out...";
