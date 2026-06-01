export const SHIPMENT_DETAILS_TAB_LIST_CLASS =
  "flex shrink-0 overflow-x-auto border-b border-zinc-200 px-4 sm:px-6 dark:border-zinc-800";

export const SHIPMENT_DETAILS_TAB_PANEL_CLASS = "flex min-h-0 min-w-0 flex-col";

/**
 * Tab content area is height-bounded so long threads don't grow the page forever.
 * Each tab panel can manage its own internal scrolling within this container.
 */
export const SHIPMENT_DETAILS_TAB_CONTENTS_CLASS =
  "grid min-w-0 min-h-[26rem] h-[min(70vh,56rem)] overflow-hidden";

export const SHIPMENT_DETAILS_TAB_STACK_SLOT_CLASS = "col-start-1 row-start-1 min-h-0 min-w-0 h-full";

export const SHIPMENT_DETAILS_TAB_REVEAL_CLASS = "flex h-full min-h-0 min-w-0 flex-col";

export const SHIPMENT_DETAILS_TAB_DOCUMENTS_PANEL_CLASS =
  "flex min-h-0 min-w-0 h-full flex-col overflow-y-auto";

export const SHIPMENT_DETAILS_TAB_MESSAGES_PANEL_CLASS =
  "flex min-h-0 min-w-0 h-full flex-col overflow-hidden";

export const SHIPMENT_DETAILS_TAB_TRACKING_PANEL_CLASS =
  "flex min-h-0 min-w-0 h-full flex-col overflow-y-auto px-4 py-4 sm:px-6";

export const SHIPMENT_TRACKING_TAB_DISABLED_TOOLTIP =
  "Tracking unlocks after the customer approves all draft documents.";

export const SHIPMENT_TRACKING_TAB_DISABLED_TOOLTIP_CLASS =
  "max-w-[18rem] text-center font-normal leading-snug whitespace-normal";

export const   SHIPMENT_TRACKING_TAB_BUTTON_DISABLED_CLASS =
  "cursor-not-allowed opacity-45 hover:text-zinc-500 dark:hover:text-zinc-400";

/** Equal-width tab slot when the tracking tab is wrapped for tooltip hover. */
export const SHIPMENT_TRACKING_TAB_SLOT_CLASS = "flex min-w-0 flex-1 basis-0";
