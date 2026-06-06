export const AUTHENTICATED_TOP_NAV_ACTION_CLASS =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/50 md:h-auto md:w-auto md:px-4 md:py-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/40";

import {
  PRIMARY_ORANGE_BUTTON_CLASS,
  PRIMARY_ORANGE_BUTTON_INNER_CLASS,
} from "@/constants/primary-orange-button";

/** Bulk import — gradient primary CTA (see `.primary-orange-btn` in globals.css). */
export const AUTHENTICATED_TOP_NAV_BULK_IMPORT_ACTION_CLASS = `${PRIMARY_ORANGE_BUTTON_CLASS} inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold md:h-auto md:w-auto md:px-4 md:py-2`;

export const AUTHENTICATED_TOP_NAV_BULK_IMPORT_INNER_CLASS = PRIMARY_ORANGE_BUTTON_INNER_CLASS;

export const AUTHENTICATED_TOP_NAV_BULK_IMPORT_ICON_CLASS = "text-white";

export const AUTHENTICATED_TOP_NAV_ACTION_LABEL_CLASS = "hidden md:inline";

export const AUTHENTICATED_TOP_NAV_BRAND_ROW_CLASS = "flex min-w-0 items-center gap-3 sm:gap-4";

/** Breadcrumbs in the main bar — large viewports only. */
export const AUTHENTICATED_TOP_NAV_BREADCRUMB_INLINE_CLASS = "hidden min-w-0 lg:block";

/** Thin strip attached below the top bar — below large breakpoint only. */
export const AUTHENTICATED_TOP_NAV_BREADCRUMB_BANNER_CLASS =
  "border-t border-zinc-200 bg-white/90 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:px-12 lg:hidden";

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
