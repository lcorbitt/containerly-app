import { SHIPMENT_COMMERCIAL_LABEL_CLASS } from "@/components/ShipmentCommercialFormFields/constants";

export const SHIPMENT_DETAIL_LABEL_CLASS = SHIPMENT_COMMERCIAL_LABEL_CLASS;

export const SHIPMENT_DETAIL_VALUE_CLASS = "mt-0.5 text-sm text-zinc-900 dark:text-zinc-100";

export const SHIPMENT_HEADER_COMMERCIAL_GRID_CLASS = "grid gap-4 sm:grid-cols-3 lg:grid-cols-4";

export const SHIPMENT_TITLE_VALUE_CLASS =
  "mt-0.5 text-lg font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50";

export const SHIPMENT_TITLE_PRIMARY_GRID_CLASS =
  "grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-0";

export const SHIPMENT_TITLE_SECONDARY_ROW_CLASS = "min-w-0";

export const SHIPMENT_TITLE_CELL_CLASS = "min-w-0";

/** Matches ShipmentDetailsCard outer border (`border-zinc-200` / `dark:border-zinc-800`). */
export const SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS = "border-zinc-200 dark:border-zinc-800";

/** Same tokens for Tailwind `divide-*` utilities (e.g. `divide-x`). */
export const SHIPMENT_COMMERCIAL_HEADER_DIVIDE_CLASS = "divide-zinc-200 dark:divide-zinc-800";

export const SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROW_CLASS = `grid grid-cols-1 gap-5 border-b pb-4 md:grid-cols-2 md:items-center md:gap-6 ${SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS}`;

export const SHIPMENT_COMMERCIAL_HEADER_SUMMARY_TITLE_COL_CLASS =
  "flex min-w-0 flex-col gap-3";

export const SHIPMENT_COMMERCIAL_HEADER_SUMMARY_ROUTE_COL_CLASS = `flex min-w-0 flex-col justify-center md:border-l md:pl-6 ${SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS}`;

export const SHIPMENT_COMMERCIAL_HEADER_GRID_WRAP_CLASS = "pt-4";

export const SHIPMENT_COMMERCIAL_HEADER_STATUS_ROW_CLASS =
  "mt-4 flex flex-wrap items-center gap-2 border-b pb-4 border-zinc-200 dark:border-zinc-800";

export const SHIPMENT_COMMERCIAL_HEADER_STATUS_ROW_LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500";

export const SHIPMENT_DOCUMENTS_STATUS_LABEL = "Documents status";

export const SHIPMENT_TITLE_FIELD_KEYS = ["customer_name", "order_number"] as const;

export const SHIPMENT_ROUTE_FIELD_KEYS = ["port_of_loading", "port_of_destination"] as const;

export const SHIPMENT_ETA_FIELD_KEYS = ["estimated_departure_at", "estimated_arrival_at"] as const;
