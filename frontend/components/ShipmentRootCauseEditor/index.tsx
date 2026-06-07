"use client";

import { GitBranchPlus } from "lucide-react";
import {
  SHIPMENT_DETAILS_ASSESSMENT_ROW_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_CONTENT_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_ICON_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS,
} from "@/components/ShipmentDetailsSubCard";
import {
  SHIPMENT_ROOT_CAUSE_LABELS,
  SHIPMENT_ROOT_CAUSES,
  type ShipmentRootCause,
} from "@shared/dto/performance.dto";

export interface ShipmentRootCauseEditorProps {
  value: ShipmentRootCause | null;
  saving?: boolean;
  onChange: (value: ShipmentRootCause | null) => void;
  variant?: "default" | "inline";
}

export function ShipmentRootCauseEditor({
  value,
  saving = false,
  onChange,
  variant = "default",
}: ShipmentRootCauseEditorProps) {
  const select = (
    <select
      id="shipment-root-cause"
      disabled={saving}
      value={value ?? ""}
      onChange={(e) => {
        const next = e.target.value.trim();
        onChange(next ? (next as ShipmentRootCause) : null);
      }}
      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <option value="">Not set</option>
      {SHIPMENT_ROOT_CAUSES.map((cause) => (
        <option key={cause} value={cause}>
          {SHIPMENT_ROOT_CAUSE_LABELS[cause]}
        </option>
      ))}
    </select>
  );

  if (variant === "inline") {
    return (
      <div className={SHIPMENT_DETAILS_ASSESSMENT_ROW_CLASS}>
        <span className={SHIPMENT_DETAILS_ASSESSMENT_ROW_ICON_CLASS} aria-hidden>
          <GitBranchPlus className="h-4 w-4" />
        </span>
        <div className={SHIPMENT_DETAILS_ASSESSMENT_ROW_CONTENT_CLASS}>
          <label htmlFor="shipment-root-cause" className={SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS}>
            Root Cause (Internal)
          </label>
          <div className="mt-1">{select}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <label htmlFor="shipment-root-cause" className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Root cause (internal)
      </label>
      <div className="mt-1">{select}</div>
    </div>
  );
}
