/**
 * JSONCargo container + BOL APIs expect `shipping_line` as one of these query values
 * (see https://jsoncargo.com/documentation-api/).
 */
export const JSONCARGO_SHIPPING_LINE_PARAMS = [
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

export type JsoncargoShippingLineParam = (typeof JSONCARGO_SHIPPING_LINE_PARAMS)[number];

const PARAM_SET = new Set<string>(JSONCARGO_SHIPPING_LINE_PARAMS);

/** Internal ID → API param (JSONCargo compatibility table). */
const ID_TO_PARAM: Record<string, JsoncargoShippingLineParam> = {
  "0010": "MAERSK",
  "0011": "HAPAG_LLOYD",
  "0012": "HMM",
  "0013": "ONE",
  "0014": "EVERGREEN",
  "0015": "MSC",
  "0016": "CMA_CGM",
  "0017": "COSCO",
  "0018": "ZIM",
  "0019": "YANG_MING",
};

function normalizeNameKey(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

/**
 * Maps BOL response `shipping_line_name` / `shipping_line_id` to the JSONCargo query enum.
 * Returns null if unknown (caller may prompt for carrier).
 */
export function toJsoncargoShippingLineParam(
  shippingLineName: string | null | undefined,
  shippingLineId: string | null | undefined,
): string | null {
  const id = shippingLineId?.trim();
  if (id && ID_TO_PARAM[id]) {
    return ID_TO_PARAM[id];
  }

  const raw = shippingLineName?.trim();
  if (!raw) return null;

  const u = raw.toUpperCase().replace(/\s+/g, "_");
  if (PARAM_SET.has(u)) {
    return u;
  }

  const key = normalizeNameKey(raw);

  if (key.includes("MAERSK")) return "MAERSK";
  if (key.includes("HAPAG")) return "HAPAG_LLOYD";
  if (key === "HMM" || key.includes("HYUNDAI MERCHANT")) return "HMM";
  if (key === "ONE" || key.includes("OCEAN NETWORK EXPRESS")) return "ONE";
  if (key.includes("EVERGREEN")) return "EVERGREEN";
  if (key === "MSC" || key.includes("MEDITERRANEAN SHIPPING")) return "MSC";
  if (key.includes("CMA") && key.includes("CGM")) return "CMA_CGM";
  if (key.includes("COSCO")) return "COSCO";
  if (key === "ZIM" || key.includes("ZIM INTEGRATED")) return "ZIM";
  if (key.includes("YANG MING") || key.includes("YANGMING")) return "YANG_MING";

  return null;
}
