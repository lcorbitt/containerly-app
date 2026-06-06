export const MARKETING_TOP_NAV_LINK_CLASS =
  "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-white dark:hover:text-primary-orange dark:active:text-primary-orange";

export const MARKETING_TOP_NAV_CTA_CLASS =
  "rounded-full border border-primary-orange/70 bg-white px-4 py-2 text-sm font-semibold text-primary-orange shadow-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/5 active:scale-[0.98] dark:border-primary-orange/85 dark:bg-black/55 dark:shadow-[0_0_24px_rgba(255,78,0,0.32)] dark:backdrop-blur-sm dark:hover:bg-primary-orange/10 dark:hover:shadow-[0_0_32px_rgba(255,78,0,0.45)]";

export const MARKETING_TOP_NAV_SECONDARY_LINK_CLASS =
  "rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary-orange/40 hover:text-zinc-900 dark:border-white/15 dark:text-zinc-200 dark:hover:border-primary-orange/50 dark:hover:text-white";

export const MARKETING_TOP_NAV_MOBILE_MENU_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 dark:border-white/10 dark:text-zinc-200 md:hidden";

export const MARKETING_TOP_NAV_MOBILE_OVERLAY_CLASS =
  "fixed inset-0 z-40 flex flex-col bg-white pt-14 dark:bg-zinc-950 md:hidden";

export const MARKETING_TOP_NAV_MOBILE_LINK_CLASS =
  "rounded-lg px-3 py-3 text-base font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5";

export const MARKETING_TOP_NAV_LAYOUT_CLASS = "flex w-full items-center";

export const MARKETING_TOP_NAV_LEFT_CLASS = "flex min-w-0 flex-1 items-center justify-start";

export const MARKETING_TOP_NAV_DESKTOP_NAV_CLASS =
  "hidden flex-1 items-center justify-center gap-8 md:flex";

export const MARKETING_TOP_NAV_DESKTOP_ACTIONS_CLASS = "hidden items-center gap-3 md:flex";

export const MARKETING_TOP_NAV_RIGHT_CLUSTER_CLASS =
  "flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3";

export const MARKETING_TOP_NAV_THEME_TOGGLE_CLASS =
  "relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent text-zinc-700 transition hover:border-zinc-200 hover:bg-zinc-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-500/40";

export const MARKETING_TOP_NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#security", label: "Security" },
] as const;

export const MARKETING_TOP_NAV_LOGIN_PATH = "/login";
