import type { CustomSelectOption } from "@/components/CustomSelect";
import {
  formatDocumentGroupLabel,
  formatDocumentTypeLabel,
} from "@/utils/document-metadata-display";
import { SHIPMENT_DOCUMENT_TYPES } from "@shared/dto/logistics.dto";

export const UPLOAD_ZONE_BODY_CLASS =
  "overflow-visible rounded-xl border border-zinc-200 dark:border-zinc-700";

export const UPLOAD_ZONE_METADATA_CLASS =
  "grid gap-3 border-b border-zinc-200 px-4 py-3 sm:grid-cols-2 dark:border-zinc-800";

export const UPLOAD_ZONE_SELECT_SHELL_CLASS =
  "relative z-[1] mt-1 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950";

/** Above upload modal panel (`z-[101]`). */
export const UPLOAD_ZONE_SELECT_LIST_REVEAL_CLASS =
  "absolute z-[110] mt-2 w-full min-w-[12rem]";

export const UPLOAD_ZONE_DROP_CLASS =
  "flex min-h-[220px] flex-col items-center justify-center rounded-b-xl px-4 py-10 text-center transition-colors";

export const UPLOAD_ZONE_IDLE_CLASS = "bg-zinc-50/60 dark:bg-zinc-900/30";

export const UPLOAD_ZONE_DRAG_CLASS = "bg-sky-50/80 dark:bg-sky-950/30";

export const UPLOAD_ZONE_BUTTON_CLASS =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900";

export const DOCUMENT_TYPE_FIELD_LABEL = "Document Type";
export const DOCUMENT_GROUP_FIELD_LABEL = "Document Group";
export const DOCUMENT_TYPE_OPTIONAL_HINT = "(optional)";

export const DOCUMENT_GROUP_SELECT_OPTIONS: CustomSelectOption[] = (
  ["draft", "revision", "original"] as const
).map((value) => ({
  value,
  label: formatDocumentGroupLabel(value)!,
}));

export const DOCUMENT_TYPE_NONE_VALUE = "";

export const DOCUMENT_TYPE_SELECT_OPTIONS: CustomSelectOption[] = [
  { value: DOCUMENT_TYPE_NONE_VALUE, label: "None" },
  ...SHIPMENT_DOCUMENT_TYPES.map((type) => ({
    value: type,
    label: formatDocumentTypeLabel(type)!,
  })),
];
