import type { CustomSelectOption } from "@/components/CustomSelect";
import { SHIPMENT_DOCUMENT_TYPES } from "@shared/dto/logistics.dto";

export const UPLOAD_ZONE_BODY_CLASS =
  "overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700";

export const UPLOAD_ZONE_METADATA_CLASS =
  "grid gap-3 border-b border-zinc-200 px-4 py-3 sm:grid-cols-2 dark:border-zinc-800";

export const UPLOAD_ZONE_SELECT_SHELL_CLASS =
  "mt-1 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950";

export const UPLOAD_ZONE_DROP_CLASS =
  "flex min-h-[220px] flex-col items-center justify-center px-4 py-10 text-center transition-colors";

export const UPLOAD_ZONE_IDLE_CLASS = "bg-zinc-50/60 dark:bg-zinc-900/30";

export const UPLOAD_ZONE_DRAG_CLASS = "bg-sky-50/80 dark:bg-sky-950/30";

export const UPLOAD_ZONE_BUTTON_CLASS =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900";

export const DOCUMENT_GROUP_SELECT_OPTIONS: CustomSelectOption[] = [
  { value: "draft", label: "Draft" },
  { value: "revision", label: "Revision" },
  { value: "original", label: "Original" },
];

export const DOCUMENT_TYPE_NONE_VALUE = "";

export const DOCUMENT_TYPE_SELECT_OPTIONS: CustomSelectOption[] = [
  { value: DOCUMENT_TYPE_NONE_VALUE, label: "None" },
  ...SHIPMENT_DOCUMENT_TYPES.map((type) => ({
    value: type,
    label: type,
  })),
];
