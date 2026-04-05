/**
 * JSONCargo `shipping_line` query values (must stay aligned with
 * `supabase/functions/_shared/jsoncargoShippingLine.ts`).
 */
export const JSONCARGO_CARRIER_ENUM_VALUES = [
  "MAERSK",
  "HAPAG_LLOYD",
  "HMM",
  "ONE",
  "EVERGREEN",
  "MSC",
  "CMA_CGM",
  "COSCO",
  "ZIM",
  "YANG_MING",
] as const;

export type JsoncargoCarrierEnum = (typeof JSONCARGO_CARRIER_ENUM_VALUES)[number];

function enumLabel(v: string): string {
  return v.replace(/_/g, " ");
}

/** JSONCargo carrier enum only (omit `shipping_line` on lookup when none selected). */
export const JSONCARGO_CARRIER_SELECT_OPTIONS: { value: string; label: string }[] =
  JSONCARGO_CARRIER_ENUM_VALUES.map((v) => ({ value: v, label: enumLabel(v) }));
