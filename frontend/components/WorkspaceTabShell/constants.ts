/** Shared workspace tab shell — operator shipment workspace and customer portal. */

export const WORKSPACE_TABS_SECTION_CLASS =
  "min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

export const WORKSPACE_TAB_LIST_CLASS =
  "flex shrink-0 overflow-x-auto border-b border-zinc-200 px-4 sm:px-6 dark:border-zinc-800";

export const WORKSPACE_TAB_PANEL_CLASS = "flex min-h-0 min-w-0 flex-col";

/**
 * Tab content area is height-bounded so long threads don't grow the page forever.
 * Each tab panel can manage its own internal scrolling within this container.
 */
export const WORKSPACE_TAB_CONTENTS_CLASS =
  "grid min-w-0 min-h-[26rem] h-[min(70vh,56rem)] overflow-hidden";

export const WORKSPACE_TAB_STACK_SLOT_CLASS = "col-start-1 row-start-1 min-h-0 min-w-0 h-full";

export const WORKSPACE_TAB_REVEAL_CLASS = "flex h-full min-h-0 min-w-0 flex-col";

export const WORKSPACE_TAB_DOCUMENTS_PANEL_CLASS =
  "flex min-h-0 min-w-0 h-full flex-col overflow-y-auto";

export const WORKSPACE_TAB_MESSAGES_PANEL_CLASS =
  "flex min-h-0 min-w-0 h-full flex-col overflow-hidden";

export const WORKSPACE_TAB_TRACKING_PANEL_CLASS =
  "flex min-h-0 min-w-0 h-full flex-col overflow-y-auto px-4 py-4 sm:px-6";

export const WORKSPACE_TAB_ACTIVITY_PANEL_CLASS =
  "flex min-h-0 min-w-0 h-full flex-col overflow-y-auto px-4 py-4 sm:px-6";
