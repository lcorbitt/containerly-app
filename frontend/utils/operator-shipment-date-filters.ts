export interface OperatorShipmentDateRangeFilter {
  etaFrom: string | null;
  etaTo: string | null;
  etdFrom: string | null;
  etdTo: string | null;
}

export const EMPTY_OPERATOR_SHIPMENT_DATE_RANGE_FILTER: OperatorShipmentDateRangeFilter = {
  etaFrom: null,
  etaTo: null,
  etdFrom: null,
  etdTo: null,
};

/** Accepts `YYYY-MM-DD` query values only. */
export function parseOptionalIsoDateParam(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

export function hasOperatorShipmentDateRangeFilter(filter: OperatorShipmentDateRangeFilter): boolean {
  return Boolean(filter.etaFrom || filter.etaTo || filter.etdFrom || filter.etdTo);
}

export function parseOperatorShipmentDateRangeFilter(input: {
  etaFrom?: string | null;
  etaTo?: string | null;
  etdFrom?: string | null;
  etdTo?: string | null;
}): OperatorShipmentDateRangeFilter {
  return {
    etaFrom: parseOptionalIsoDateParam(input.etaFrom),
    etaTo: parseOptionalIsoDateParam(input.etaTo),
    etdFrom: parseOptionalIsoDateParam(input.etdFrom),
    etdTo: parseOptionalIsoDateParam(input.etdTo),
  };
}
