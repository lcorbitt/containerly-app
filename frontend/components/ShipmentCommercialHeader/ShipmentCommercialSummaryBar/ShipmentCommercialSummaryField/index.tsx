import {
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_CELL_CLASS,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_VALUE_CLASS,
} from "../constants";

export function ShipmentCommercialSummaryField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className ? `${SHIPMENT_COMMERCIAL_SUMMARY_BAR_CELL_CLASS} ${className}` : SHIPMENT_COMMERCIAL_SUMMARY_BAR_CELL_CLASS}>
      <p className={SHIPMENT_COMMERCIAL_SUMMARY_BAR_LABEL_CLASS}>{label}</p>
      <p
        className={`${SHIPMENT_COMMERCIAL_SUMMARY_BAR_VALUE_CLASS} break-words`}
        title={value !== "—" ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}
