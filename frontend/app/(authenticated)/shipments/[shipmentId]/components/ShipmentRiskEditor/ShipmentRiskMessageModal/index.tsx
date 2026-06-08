"use client";

import { Modal } from "@/components/Modal";
import {
  SHIPMENT_RISK_MESSAGE_MODAL_BODY_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_CANCEL_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_SAVE_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_TEXTAREA_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_TITLE,
} from "./constants";
import { ShipmentRiskChangeSummary } from "./ShipmentRiskChangeSummary";
import type { ShipmentRiskMessageModalProps } from "./types";

export function ShipmentRiskMessageModal({
  open,
  currentRisk,
  destinationRisk,
  message,
  saving,
  onDestinationRiskChange,
  onMessageChange,
  onClose,
  onSave,
}: ShipmentRiskMessageModalProps) {
  const canSave = message.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={SHIPMENT_RISK_MESSAGE_MODAL_TITLE}
      size="md"
      busy={saving}
      bodyClassName={SHIPMENT_RISK_MESSAGE_MODAL_BODY_CLASS}
      footer={
        <>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className={SHIPMENT_RISK_MESSAGE_MODAL_CANCEL_CLASS}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !canSave}
            onClick={onSave}
            className={SHIPMENT_RISK_MESSAGE_MODAL_SAVE_CLASS}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <ShipmentRiskChangeSummary
        currentRisk={currentRisk}
        destinationRisk={destinationRisk}
        onDestinationRiskChange={onDestinationRiskChange}
        disabled={saving}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave && !saving) onSave();
        }}
      >
        <label className="block text-xs text-zinc-500 dark:text-zinc-400">
          Required when updating shipment risk.
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={3}
            required
            autoFocus
            className={SHIPMENT_RISK_MESSAGE_MODAL_TEXTAREA_CLASS}
            placeholder="e.g. Container cleared customs; expect delivery next week"
          />
        </label>
      </form>
    </Modal>
  );
}
