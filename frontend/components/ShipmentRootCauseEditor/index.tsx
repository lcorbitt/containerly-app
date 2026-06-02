"use client";

import {
  SHIPMENT_ROOT_CAUSE_LABELS,
  SHIPMENT_ROOT_CAUSES,
  type ShipmentRootCause,
} from "@shared/dto/performance.dto";

export interface ShipmentRootCauseEditorProps {
  value: ShipmentRootCause | null;
  saving?: boolean;
  onChange: (value: ShipmentRootCause | null) => void;
}

export function ShipmentRootCauseEditor({ value, saving = false, onChange }: ShipmentRootCauseEditorProps) {
  return (
    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <label htmlFor="shipment-root-cause" className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Root cause (internal)
      </label>
      <select
        id="shipment-root-cause"
        disabled={saving}
        value={value ?? ""}
        onChange={(e) => {
          const next = e.target.value.trim();
          onChange(next ? (next as ShipmentRootCause) : null);
        }}
        className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <option value="">Not set</option>
        {SHIPMENT_ROOT_CAUSES.map((cause) => (
          <option key={cause} value={cause}>
            {SHIPMENT_ROOT_CAUSE_LABELS[cause]}
          </option>
        ))}
      </select>
    </div>
  );
}
