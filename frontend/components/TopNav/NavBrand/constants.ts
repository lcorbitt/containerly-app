import type { TopNavVariant } from "../TopNavShell/types";

/** Pre-sized nav asset (140×112); static import enables blur + immutable hashed URL in production. */
export const NAV_BRAND_LOGO_INTRINSIC_WIDTH = 140;
export const NAV_BRAND_LOGO_INTRINSIC_HEIGHT = 112;

/** Match rendered logo width at each breakpoint (2× asset covers retina). */
export const NAV_BRAND_LOGO_SIZES = "(max-width: 767px) 36px, 56px";

export const NAV_BRAND_LOGO_CLASS =
  "h-9 w-auto shrink-0 select-none md:h-14";

export const NAV_BRAND_CLASS: Record<TopNavVariant, string> = {
  marketing:
    "text-lg font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-700 md:text-xl dark:text-white dark:hover:text-zinc-100",
  app: "text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl",
};

export const NAV_BRAND_TEXT_CLASS: Record<TopNavVariant, string> = {
  marketing: "text-2xl font-bold",
  app: "",
};
