/** Commercial header field labels (mirrors ShipmentCommercialFormFields/constants.ts). */
export const COMMERCIAL_FIELD_LABELS: Record<string, string> = {
  order_number: "Order No",
  carrier_booking_number: "Carrier Booking No.",
  container_number: "Container No.",
  customer_name: "Customer",
  consignee: "Consignee",
  country: "Country",
  port_of_loading: "Port of Loading",
  port_of_destination: "Port of Destination",
  estimated_departure_at: "Est Date of Departure",
  estimated_arrival_at: "Est Date of Arrival",
  freight_booking_carrier: "Freight Booking Carrier",
  vessel: "Vessel",
  voyage: "Voyage",
  health_certificate_no: "Health Certificate No",
  trade_terms: "Trade Terms",
  bill_of_lading: "Bill of Lading",
  shipping_line: "Shipping Line",
};

const MAIL_WORKFLOW_FIELDS = new Set([
  "physical_mail_tracking_number",
  "physical_mail_sent_at",
  "workflow_status",
]);

export type CommercialFieldChange = {
  field: string;
  label: string;
  previous: string | null;
  next: string | null;
};

function normalizeComparableValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    return trimmed;
  }
  return String(value);
}

function formatDisplayValue(value: string | null): string | null {
  if (value === null) return null;
  return value;
}

export function isMailOrWorkflowOnlyUpdate(updateFields: Record<string, unknown>): boolean {
  const keys = Object.keys(updateFields);
  if (keys.length === 0) return false;
  return keys.every((key) => MAIL_WORKFLOW_FIELDS.has(key));
}

export function buildCommercialEditChanges(
  existing: Record<string, unknown>,
  updateFields: Record<string, unknown>,
): CommercialFieldChange[] {
  const changes: CommercialFieldChange[] = [];

  for (const [field, nextRaw] of Object.entries(updateFields)) {
    if (MAIL_WORKFLOW_FIELDS.has(field)) continue;
    if (!(field in COMMERCIAL_FIELD_LABELS)) continue;

    const previousNorm = normalizeComparableValue(existing[field]);
    const nextNorm = normalizeComparableValue(nextRaw);
    if (previousNorm === nextNorm) continue;

    changes.push({
      field,
      label: COMMERCIAL_FIELD_LABELS[field] ?? field,
      previous: formatDisplayValue(previousNorm),
      next: formatDisplayValue(nextNorm),
    });
  }

  return changes;
}

export function formatChangedFieldLabels(changes: CommercialFieldChange[]): string {
  return changes.map((c) => c.label).join(", ");
}
