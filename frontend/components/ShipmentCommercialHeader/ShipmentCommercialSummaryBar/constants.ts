import { SHIPMENT_COMMERCIAL_HEADER_DIVIDE_CLASS } from "../constants";

export const SHIPMENT_COMMERCIAL_SUMMARY_BAR_CLASS = `grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/70 px-4 py-4 dark:bg-zinc-900/35 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] md:gap-0 md:divide-x ${SHIPMENT_COMMERCIAL_HEADER_DIVIDE_CLASS}`;

export const SHIPMENT_COMMERCIAL_SUMMARY_BAR_CELL_CLASS =
  "flex min-w-0 flex-col md:px-5 first:md:pl-0 last:md:pr-0";

export const SHIPMENT_COMMERCIAL_SUMMARY_BAR_LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500";

export const SHIPMENT_COMMERCIAL_SUMMARY_BAR_VALUE_CLASS =
  "mt-1 text-xl font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50";

export const SHIPMENT_COMMERCIAL_SUMMARY_BAR_LANE_CELL_CLASS =
  "flex min-w-0 flex-col md:col-span-1 md:px-5 last:md:pr-0";
