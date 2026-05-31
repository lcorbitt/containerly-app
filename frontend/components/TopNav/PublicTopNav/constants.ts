export const PUBLIC_TOP_NAV_LINK_CLASS =
  "text-sm font-medium text-zinc-400 transition-colors hover:text-white";

export const PUBLIC_TOP_NAV_CTA_CLASS =
  "rounded-full border border-primary-orange/85 bg-black/55 px-4 py-2 text-sm font-semibold text-primary-orange shadow-[0_0_24px_rgba(255,78,0,0.32)] backdrop-blur-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/10 hover:shadow-[0_0_32px_rgba(255,78,0,0.45)] active:scale-[0.98]";

export const PUBLIC_TOP_NAV_SECONDARY_LINK_CLASS =
  "rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-primary-orange/50 hover:text-white";

export const PUBLIC_TOP_NAV_MOBILE_MENU_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 md:hidden";

export const PUBLIC_TOP_NAV_MOBILE_OVERLAY_CLASS =
  "fixed inset-0 z-40 flex flex-col bg-[#030303] pt-14 md:hidden";

export const PUBLIC_TOP_NAV_MOBILE_LINK_CLASS =
  "rounded-lg px-3 py-3 text-base font-medium text-zinc-200 hover:bg-white/5";

export const PUBLIC_TOP_NAV_DESKTOP_NAV_CLASS = "hidden items-center gap-8 md:flex";

export const PUBLIC_TOP_NAV_DESKTOP_ACTIONS_CLASS = "hidden items-center gap-3 md:flex";

export const PUBLIC_TOP_NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#security", label: "Security" },
] as const;

export const PUBLIC_TOP_NAV_LOGIN_PATH = "/login";
