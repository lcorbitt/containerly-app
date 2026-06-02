import type { CustomSelectOption } from "@/components/CustomSelect";
import {
  SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS,
  SHIPMENT_DETAIL_LABEL_CLASS,
} from "@/components/ShipmentCommercialHeader/constants";

export { SHIPMENT_DETAIL_LABEL_CLASS };

export const SHIPMENT_RISK_EDITOR_SECTION_CLASS = `mt-4 border-t pt-4 ${SHIPMENT_COMMERCIAL_HEADER_DIVIDER_CLASS}`;

export const SHIPMENT_RISK_EDITOR_ROW_CLASS = "flex min-w-0 items-center gap-2";

export const SHIPMENT_RISK_EDITOR_LABEL_CLASS = `${SHIPMENT_DETAIL_LABEL_CLASS} shrink-0`;

export const SHIPMENT_RISK_EDITOR_SELECT_SHELL_CLASS =
  "w-[8.5rem] shrink-0 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950 [&_button]:py-1 [&_button]:text-xs";

export const SHIPMENT_RISK_EDITOR_PILL_CLASS =
  "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium";

export const SHIPMENT_RISK_SELECT_OPTIONS: CustomSelectOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
