import {
  BUTTON_VARIANT_AMBER_SOFT_CLASS,
  BUTTON_VARIANT_AMBER_SOFT_ICON_CLASS,
} from "@/utils/button-variants";

export const AUTHENTICATED_TOP_NAV_ACTION_CLASS =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/50 md:h-auto md:w-auto md:px-4 md:py-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/40";

export const AUTHENTICATED_TOP_NAV_AMBER_ACTION_CLASS = `inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition focus-visible:outline md:h-auto md:w-auto md:px-4 md:py-2 ${BUTTON_VARIANT_AMBER_SOFT_CLASS}`;

export const AUTHENTICATED_TOP_NAV_ACTION_LABEL_CLASS = "hidden md:inline";

export { BUTTON_VARIANT_AMBER_SOFT_ICON_CLASS as AUTHENTICATED_TOP_NAV_AMBER_ICON_CLASS };

export const AUTHENTICATED_TOP_NAV_AVATAR_BUTTON_CLASS =
  "relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-medium text-zinc-800 ring-2 ring-transparent transition hover:bg-zinc-300 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus-visible:ring-zinc-500";

export const AUTHENTICATED_TOP_NAV_MENU_REVEAL_CLASS = "absolute right-0 z-50 mt-2 w-56";

export const AUTHENTICATED_TOP_NAV_MENU_CLASS =
  "origin-top-right rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950";

export const AUTHENTICATED_TOP_NAV_MENU_ITEM_CLASS =
  "w-full cursor-pointer rounded-bl-xl rounded-br-xl p-4 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900";

export const AUTHENTICATED_TOP_NAV_LOGOUT_LABEL = "Log out";

export const AUTHENTICATED_TOP_NAV_SIGNING_OUT_LABEL = "Signing out...";

export const AUTHENTICATED_TOP_NAV_BRAND_ROW_CLASS = "flex min-w-0 items-center gap-3 sm:gap-4";

export const AUTHENTICATED_TOP_NAV_ACTIONS_ROW_CLASS =
  "ml-auto flex items-center gap-5 sm:gap-8 md:gap-10";

export const AUTHENTICATED_TOP_NAV_ACTIONS_PRIMARY_GROUP_CLASS = "flex items-center gap-2 sm:gap-3";

export const AUTHENTICATED_TOP_NAV_ACTIONS_UTILITY_GROUP_CLASS = "flex items-center gap-1.5 sm:gap-2";

/** Emphasized surface (utility button hover, sidenav active tab). */
export const AUTHENTICATED_TOP_NAV_UTILITY_BUTTON_EMPHASIZED_SURFACE_CLASS =
  "border border-zinc-200 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900";

/** Hover surface shared by theme toggle, notifications bell, and sidenav tabs. */
export const AUTHENTICATED_TOP_NAV_UTILITY_BUTTON_HOVER_SURFACE_CLASS = `border border-transparent bg-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900`;

/** Theme toggle + notifications — border appears on hover only. */
export const AUTHENTICATED_TOP_NAV_UTILITY_ICON_BUTTON_CLASS = `relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-700 transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:text-zinc-200 dark:focus-visible:ring-zinc-500/40 ${AUTHENTICATED_TOP_NAV_UTILITY_BUTTON_HOVER_SURFACE_CLASS}`;

export const AUTHENTICATED_TOP_NAV_ORG_HREF = "/dashboard";
