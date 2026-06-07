"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  FileText,
  Lightbulb,
  MessageSquare,
  Plane,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { ShipmentDetailsSubCard } from "@/components/ShipmentDetailsSubCard";
import type { ShipmentActionHandlerKey } from "@/utils/shipment-actions";
import {
  SUGGESTED_SHIPMENT_ACTION_CHIP_CLASS,
  SUGGESTED_SHIPMENT_ACTION_ITEM_CLASS,
  SUGGESTED_SHIPMENT_ACTION_ITEM_ICON_CLASS,
  SUGGESTED_SHIPMENT_ACTION_ITEM_ICON_WRAP_CLASS,
  SUGGESTED_SHIPMENT_ACTION_ITEM_LABEL_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_EMPTY_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_EMPTY_TEXT,
  SUGGESTED_SHIPMENT_ACTIONS_LABEL_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_LIST_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_ACTIONS_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_HEADER_ICON_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_LABEL_GROUP_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_ROW_CLASS,
  SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_TITLE_CLASS,
} from "./constants";
import type { SuggestedShipmentActionsProps } from "./types";

const SUGGESTED_ACTION_ICONS: Partial<Record<ShipmentActionHandlerKey, LucideIcon>> = {
  reply_to_customer: MessageSquare,
  upload_draft_documents: Upload,
  request_missing_document: Upload,
  notify_customer_delay: AlertTriangle,
  escalate_to_carrier: Plane,
  set_risk_level: ShieldAlert,
  review_documents: FileText,
  report_issue: AlertTriangle,
};

function ActionIconTile({ handlerKey }: { handlerKey: ShipmentActionHandlerKey }) {
  const Icon = SUGGESTED_ACTION_ICONS[handlerKey] ?? FileText;
  return (
    <span className={SUGGESTED_SHIPMENT_ACTION_ITEM_ICON_WRAP_CLASS} aria-hidden>
      <Icon className={SUGGESTED_SHIPMENT_ACTION_ITEM_ICON_CLASS} />
    </span>
  );
}

export function SuggestedShipmentActions({ actions, onAction, variant = "chips" }: SuggestedShipmentActionsProps) {
  if (actions.length === 0 && (variant === "chips" || variant === "standalone")) return null;

  if (variant === "chips") {
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

  if (variant === "standalone") {
    return (
      <div className={SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_ROW_CLASS} aria-label="Suggested actions">
        <div className={SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_LABEL_GROUP_CLASS}>
          <Lightbulb className={SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_HEADER_ICON_CLASS} aria-hidden />
          <h2 className={SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_TITLE_CLASS}>Suggested Actions</h2>
        </div>
        <div className={SUGGESTED_SHIPMENT_ACTIONS_STANDALONE_ACTIONS_CLASS}>
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

  return (
    <ShipmentDetailsSubCard title="Suggested Actions" icon={Lightbulb}>
      {actions.length === 0 ? (
        <p className={SUGGESTED_SHIPMENT_ACTIONS_EMPTY_CLASS}>{SUGGESTED_SHIPMENT_ACTIONS_EMPTY_TEXT}</p>
      ) : (
        <ul className={SUGGESTED_SHIPMENT_ACTIONS_LIST_CLASS}>
          {actions.map((action) => {
            const handlerKey = action.handler_key as ShipmentActionHandlerKey;
            return (
              <li key={action.id}>
                <button
                  type="button"
                  title={action.description ?? undefined}
                  className={SUGGESTED_SHIPMENT_ACTION_ITEM_CLASS}
                  onClick={() => onAction(action)}
                >
                  <ActionIconTile handlerKey={handlerKey} />
                  <span className={SUGGESTED_SHIPMENT_ACTION_ITEM_LABEL_CLASS}>{action.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ShipmentDetailsSubCard>
  );
}
