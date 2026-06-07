import {
  SHIPMENT_OVERVIEW_DATE_FILTER_CLEAR_CLASS,
  SHIPMENT_OVERVIEW_DATE_FILTERS_CLASS,
  SHIPMENT_OVERVIEW_DATE_RANGE_GROUP_CLASS,
  SHIPMENT_OVERVIEW_DATE_RANGE_GROUP_LABEL_CLASS,
  SHIPMENT_OVERVIEW_DATE_RANGE_INPUT_CLASS,
  SHIPMENT_OVERVIEW_DATE_RANGE_SEPARATOR_CLASS,
} from "./constants";
import type { ShipmentOverviewDateFiltersProps } from "./types";

function DateRangeGroup({
  label,
  fromId,
  toId,
  fromValue,
  toValue,
  disabled,
  onFromChange,
  onToChange,
}: {
  label: string;
  fromId: string;
  toId: string;
  fromValue: string;
  toValue: string;
  disabled?: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <div className={SHIPMENT_OVERVIEW_DATE_RANGE_GROUP_CLASS}>
      <span className={SHIPMENT_OVERVIEW_DATE_RANGE_GROUP_LABEL_CLASS}>{label}</span>
      <input
        id={fromId}
        type="date"
        value={fromValue}
        disabled={disabled}
        aria-label={`${label} from`}
        onChange={(e) => onFromChange(e.target.value)}
        className={SHIPMENT_OVERVIEW_DATE_RANGE_INPUT_CLASS}
      />
      <span className={SHIPMENT_OVERVIEW_DATE_RANGE_SEPARATOR_CLASS} aria-hidden>
        –
      </span>
      <input
        id={toId}
        type="date"
        value={toValue}
        disabled={disabled}
        aria-label={`${label} to`}
        onChange={(e) => onToChange(e.target.value)}
        className={SHIPMENT_OVERVIEW_DATE_RANGE_INPUT_CLASS}
      />
    </div>
  );
}

export function ShipmentOverviewDateFilters({
  etdFrom,
  etdTo,
  etaFrom,
  etaTo,
  disabled = false,
  onEtdFromChange,
  onEtdToChange,
  onEtaFromChange,
  onEtaToChange,
  onClear,
}: ShipmentOverviewDateFiltersProps) {
  const hasFilters = Boolean(etdFrom || etdTo || etaFrom || etaTo);

  return (
    <div className={SHIPMENT_OVERVIEW_DATE_FILTERS_CLASS}>
      <DateRangeGroup
        label="ETD"
        fromId="shipments-overview-etd-from"
        toId="shipments-overview-etd-to"
        fromValue={etdFrom}
        toValue={etdTo}
        disabled={disabled}
        onFromChange={onEtdFromChange}
        onToChange={onEtdToChange}
      />
      <DateRangeGroup
        label="ETA"
        fromId="shipments-overview-eta-from"
        toId="shipments-overview-eta-to"
        fromValue={etaFrom}
        toValue={etaTo}
        disabled={disabled}
        onFromChange={onEtaFromChange}
        onToChange={onEtaToChange}
      />
      {hasFilters ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className={SHIPMENT_OVERVIEW_DATE_FILTER_CLEAR_CLASS}
        >
          Clear Dates
        </button>
      ) : null}
    </div>
  );
}
