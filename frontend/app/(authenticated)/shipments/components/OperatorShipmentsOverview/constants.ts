export const SHIPMENT_OVERVIEW_ACTIONS_HEADER_CLASS = "w-12 px-2";

export const SHIPMENT_OVERVIEW_ACTIONS_CELL_CLASS = "w-12 px-2 text-right";

export const SHIPMENT_OVERVIEW_DELETE_BUTTON_CLASS =
  "inline-flex rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400";

export const SHIPMENT_OVERVIEW_TOOLBAR_CLASS =
  "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

export const SHIPMENT_OVERVIEW_SEARCH_CONTAINER_CLASS = "w-full max-w-md sm:max-w-sm";

export const SHIPMENT_OVERVIEW_FILTERS_CLASS = "flex flex-wrap items-center justify-start gap-2 sm:justify-end";

export const SHIPMENT_OVERVIEW_SEARCH_INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500";

export const shipmentOverviewFilterButtonClass = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;

export const SHIPMENT_OVERVIEW_REFRESH_BUTTON_CLASS =
  "inline-flex rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";
