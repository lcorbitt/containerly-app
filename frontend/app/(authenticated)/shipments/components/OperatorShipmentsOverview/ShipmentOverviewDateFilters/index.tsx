import {
  SHIPMENT_OVERVIEW_DATE_FILTER_CLEAR_CLASS,
  SHIPMENT_OVERVIEW_DATE_FILTER_FIELD_CLASS,
  SHIPMENT_OVERVIEW_DATE_FILTER_FIELD_LABEL_CLASS,
  SHIPMENT_OVERVIEW_DATE_FILTER_GROUP_CLASS,
  SHIPMENT_OVERVIEW_DATE_FILTER_INPUT_CLASS,
  SHIPMENT_OVERVIEW_DATE_FILTER_LABEL_CLASS,
  SHIPMENT_OVERVIEW_DATE_FILTERS_CLASS,
} from "./constants";
import type { ShipmentOverviewDateFiltersProps } from "./types";

function DateField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={SHIPMENT_OVERVIEW_DATE_FILTER_FIELD_CLASS} htmlFor={id}>
      <span className={SHIPMENT_OVERVIEW_DATE_FILTER_FIELD_LABEL_CLASS}>{label}</span>
      <input
        id={id}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={SHIPMENT_OVERVIEW_DATE_FILTER_INPUT_CLASS}
      />
    </label>
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
      <div className={SHIPMENT_OVERVIEW_DATE_FILTER_GROUP_CLASS}>
        <span className={SHIPMENT_OVERVIEW_DATE_FILTER_LABEL_CLASS}>ETD</span>
        <DateField
          id="shipments-overview-etd-from"
          label="From"
          value={etdFrom}
          disabled={disabled}
          onChange={onEtdFromChange}
        />
        <DateField
          id="shipments-overview-etd-to"
          label="To"
          value={etdTo}
          disabled={disabled}
          onChange={onEtdToChange}
        />
      </div>

      <div className={SHIPMENT_OVERVIEW_DATE_FILTER_GROUP_CLASS}>
        <span className={SHIPMENT_OVERVIEW_DATE_FILTER_LABEL_CLASS}>ETA</span>
        <DateField
          id="shipments-overview-eta-from"
          label="From"
          value={etaFrom}
          disabled={disabled}
          onChange={onEtaFromChange}
        />
        <DateField
          id="shipments-overview-eta-to"
          label="To"
          value={etaTo}
          disabled={disabled}
          onChange={onEtaToChange}
        />
      </div>

      <button
        type="button"
        disabled={disabled || !hasFilters}
        onClick={onClear}
        className={SHIPMENT_OVERVIEW_DATE_FILTER_CLEAR_CLASS}
      >
        Clear Dates
      </button>
    </div>
  );
}
