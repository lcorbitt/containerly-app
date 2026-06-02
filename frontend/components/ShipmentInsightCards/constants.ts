export const SHIPMENT_INSIGHT_CARDS_CLASS = "flex flex-col gap-2";

export const SHIPMENT_INSIGHT_CARD_BASE_CLASS =
  "rounded-lg border px-3 py-2 text-sm";

export const SHIPMENT_INSIGHT_CARD_TONE_CLASS = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
  critical:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
} as const;

export const SHIPMENT_INSIGHT_CARD_HEADLINE_CLASS = "font-medium";

export const SHIPMENT_INSIGHT_CARD_DETAIL_CLASS = "mt-0.5 text-xs opacity-90";
