import type { CustomSelectOption } from "@/components/CustomSelect";
import { SHIPMENT_DOCUMENT_TYPES } from "@shared/dto/logistics.dto";

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
