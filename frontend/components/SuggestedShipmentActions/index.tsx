"use client";

import {
  SUGGESTED_SHIPMENT_ACTION_CHIP_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_LABEL_CLASS,
} from "./constants";
import type { SuggestedShipmentActionsProps } from "./types";

export function SuggestedShipmentActions({ actions, onAction }: SuggestedShipmentActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div aria-label="Suggested actions">
      <p className={SUGGESTED_SHIPMENT_ACTIONS_LABEL_CLASS}>Suggested actions</p>
      <div className={`mt-1.5 ${SUGGESTED_SHIPMENT_ACTIONS_CLASS}`}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.description ?? undefined}
            className={SUGGESTED_SHIPMENT_ACTION_CHIP_CLASS}
            onClick={() => onAction(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
