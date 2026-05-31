import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { SHIPMENT_DETAIL_GRID_FIELDS, SHIPMENT_DETAIL_LABEL_CLASS, SHIPMENT_DETAIL_VALUE_CLASS } from "./utils";

export function ShipmentHeaderInfo({ row }: { row: ShipmentWorkspaceRow }) {
  return (
    <section className="">
      <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-3">
        {SHIPMENT_DETAIL_GRID_FIELDS.map((field) => {
          const raw = row[field.key as keyof ShipmentWorkspaceRow];
          const value = field.format(typeof raw === "string" ? raw : raw == null ? null : String(raw));
          return (
            <div key={field.key}>
              <dt className={SHIPMENT_DETAIL_LABEL_CLASS}>{field.label}</dt>
              <dd
                className={`${SHIPMENT_DETAIL_VALUE_CLASS}${"mono" in field && field.mono ? " font-mono text-xs" : ""}`}
              >
                {value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
