import {
  PRIMARY_ORANGE_BUTTON_CLASS,
  PRIMARY_ORANGE_BUTTON_INNER_CLASS,
} from "@/constants/primary-orange-button";

export const SHIPMENT_SHARE_MENU_PANEL_WIDTH_PX = 420;

export const SHIPMENT_SHARE_MENU_PANEL_REVEAL_CLASS = "fixed z-[200]";

export const SHIPMENT_SHARE_MENU_PANEL_CLASS =
  "flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-950";

export const SHIPMENT_SHARE_MENU_PANEL_BODY_CLASS =
  "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4";

export const SHIPMENT_SHARE_MENU_ATTENTION_BADGE_CLASS =
  "flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white";

export const SHIPMENT_SHARE_MENU_TRIGGER_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-900/40 dark:bg-primary-orange dark:hover:bg-primary-orange/90 dark:focus-visible:ring-primary-orange/40";

export const SHIPMENT_SHARE_MENU_TRIGGER_SIDEBAR_CLASS = `${SHIPMENT_SHARE_MENU_TRIGGER_CLASS} relative w-full`;

export const SHIPMENT_SHARE_MENU_TRIGGER_LABEL_CLASS = "inline-flex items-center gap-1.5";

export const SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_SIDEBAR_CLASS =
  "absolute right-3.5 top-1/2 -translate-y-1/2";

export const SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_CLASS =
  "h-3.5 w-3.5 shrink-0 opacity-80 transition-transform duration-200";

export const SHIPMENT_SHARE_MENU_PRIMARY_ACTION_CLASS = `${PRIMARY_ORANGE_BUTTON_CLASS} inline-flex h-9 shrink-0 items-center justify-center rounded-md px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50`;

export const SHIPMENT_SHARE_MENU_PRIMARY_ACTION_INNER_CLASS = PRIMARY_ORANGE_BUTTON_INNER_CLASS;
