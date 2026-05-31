"use client";

import type { ShipmentCommercialFormValues } from "./types";
import {
  SHIPMENT_COMMERCIAL_FIELD_CLASS,
  SHIPMENT_COMMERCIAL_GRID_FIELD_DEFS,
  SHIPMENT_COMMERCIAL_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_TITLE_FIELD_DEFS,
} from "./utils";

export function ShipmentCommercialFormFields({
  values,
  onChange,
  fieldClass = SHIPMENT_COMMERCIAL_FIELD_CLASS,
}: {
  values: ShipmentCommercialFormValues;
  onChange: (patch: Partial<ShipmentCommercialFormValues>) => void;
  fieldClass?: string;
}) {
  return (
    <>
      <div className="flex w-full items-end justify-between gap-6">
        {SHIPMENT_COMMERCIAL_TITLE_FIELD_DEFS.map((field) => {
          const isCustomer = field.key === "customerName";
          const isOrderNumber = field.key === "orderNumber";
          const value = values[field.key];
          return (
            <label
              key={field.key}
              className={
                isCustomer ? "block min-w-0 flex-1" : isOrderNumber ? "block shrink-0" : "block min-w-0"
              }
            >
              <span className={SHIPMENT_COMMERCIAL_LABEL_CLASS}>
                {field.label}
                {"required" in field && field.required ? " *" : ""}
              </span>
              <input
                value={value}
                onChange={(e) => onChange({ [field.key]: e.target.value })}
                className={`${fieldClass}${isOrderNumber ? " whitespace-nowrap" : ""}`}
                required={"required" in field && field.required}
              />
            </label>
          );
        })}
      </div>

      <section className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Shipment details
        </h2>

        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {SHIPMENT_COMMERCIAL_GRID_FIELD_DEFS.map((field) => {
            const value = values[field.key];
            const inputType = "type" in field ? field.type : "text";
            return (
              <label key={field.key} className="block min-w-0">
                <span className={SHIPMENT_COMMERCIAL_LABEL_CLASS}>
                  {field.label}
                  {"required" in field && field.required ? " *" : ""}
                </span>
                <input
                  type={inputType}
                  value={value}
                  onChange={(e) => onChange({ [field.key]: e.target.value })}
                  className={`${fieldClass}${"mono" in field && field.mono ? " font-mono text-xs" : ""}`}
                  required={"required" in field && field.required}
                />
              </label>
            );
          })}
        </div>
      </section>
    </>
  );
}
