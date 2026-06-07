import type { ShipmentCommercialHeaderSource } from "../types";
import { SHIPMENT_DETAIL_GRID_FIELDS } from "../utils";
import {
  SHIPMENT_COMMERCIAL_DETAILS_CELL_ACCENT_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_CELL_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_CELL_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_CELL_VALUE_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_GRID_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_GRID_SECTION_CLASS,
} from "./constants";

export function ShipmentCommercialDetailsGrid({ source }: { source: ShipmentCommercialHeaderSource }) {
  return (
    <section className={SHIPMENT_COMMERCIAL_DETAILS_GRID_SECTION_CLASS} aria-label="Commercial details">
      <dl className={SHIPMENT_COMMERCIAL_DETAILS_GRID_CLASS}>
        {SHIPMENT_DETAIL_GRID_FIELDS.map((field) => {
          const raw = source[field.key];
          const value = field.format(typeof raw === "string" ? raw : raw == null ? null : String(raw));

          return (
            <div key={field.key} className={SHIPMENT_COMMERCIAL_DETAILS_CELL_CLASS}>
              <dt className={SHIPMENT_COMMERCIAL_DETAILS_CELL_LABEL_CLASS}>{field.label}</dt>
              <dd className={SHIPMENT_COMMERCIAL_DETAILS_CELL_VALUE_CLASS} title={value !== "—" ? value : undefined}>
                {value}
              </dd>
              <span className={SHIPMENT_COMMERCIAL_DETAILS_CELL_ACCENT_CLASS} aria-hidden />
            </div>
          );
        })}
      </dl>
    </section>
  );
}
