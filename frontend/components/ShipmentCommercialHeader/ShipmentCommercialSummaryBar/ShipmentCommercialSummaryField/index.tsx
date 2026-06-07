import { displayValue } from "../../utils";
import {
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_CELL_CLASS,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_CONSIGNEE_CLASS,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_CONSIGNEE_LABEL,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_SUMMARY_BAR_VALUE_CLASS,
} from "../constants";

export function ShipmentCommercialSummaryField({
  label,
  value,
  consignee,
  className,
}: {
  label: string;
  value: string;
  /** When set (including null), shown as a small line under the value (Customer cell only). */
  consignee?: string | null;
  className?: string;
}) {
  const consigneeDisplay = consignee !== undefined ? displayValue(consignee) : null;

  return (
    <div className={className ? `${SHIPMENT_COMMERCIAL_SUMMARY_BAR_CELL_CLASS} ${className}` : SHIPMENT_COMMERCIAL_SUMMARY_BAR_CELL_CLASS}>
      <p className={SHIPMENT_COMMERCIAL_SUMMARY_BAR_LABEL_CLASS}>{label}</p>
      <p
        className={`${SHIPMENT_COMMERCIAL_SUMMARY_BAR_VALUE_CLASS} break-words`}
        title={value !== "—" ? value : undefined}
      >
        {value}
      </p>
      {consigneeDisplay !== null ? (
        <p
          className={SHIPMENT_COMMERCIAL_SUMMARY_BAR_CONSIGNEE_CLASS}
          title={consigneeDisplay !== "—" ? consigneeDisplay : undefined}
        >
          {SHIPMENT_COMMERCIAL_SUMMARY_BAR_CONSIGNEE_LABEL}: {consigneeDisplay}
        </p>
      ) : null}
    </div>
  );
}
