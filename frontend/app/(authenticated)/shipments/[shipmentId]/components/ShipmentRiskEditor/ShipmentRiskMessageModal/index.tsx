"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { Reveal } from "@/components/Reveal";
import {
  SHIPMENT_RISK_MESSAGE_MODAL_BACKDROP_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_BODY_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_CANCEL_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_FOOTER_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_HEADER_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_PANEL_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_REVEAL_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_SAVE_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_SHELL_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_TEXTAREA_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_TITLE_CLASS,
} from "./constants";
import type { ShipmentRiskMessageModalProps } from "./types";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ShipmentRiskMessageModal({
  open,
  message,
  saving,
  onMessageChange,
  onClose,
  onSave,
}: ShipmentRiskMessageModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const canSave = message.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, saving, onClose]);

  if (!isClient) return null;

  return createPortal(
    <Reveal show={open} className={SHIPMENT_RISK_MESSAGE_MODAL_REVEAL_CLASS}>
      <div className={SHIPMENT_RISK_MESSAGE_MODAL_SHELL_CLASS}>
        <button
          type="button"
          aria-label="Close dialog"
          className={SHIPMENT_RISK_MESSAGE_MODAL_BACKDROP_CLASS}
          onClick={() => {
            if (!saving) onClose();
          }}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={SHIPMENT_RISK_MESSAGE_MODAL_PANEL_CLASS}
        >
          <div className={SHIPMENT_RISK_MESSAGE_MODAL_HEADER_CLASS}>
            <h2 id={titleId} className={SHIPMENT_RISK_MESSAGE_MODAL_TITLE_CLASS}>
              Update risk status message
            </h2>
            <DialogCloseButton
              onClick={() => {
                if (!saving) onClose();
              }}
              disabled={saving}
            />
          </div>

          <form
            className={SHIPMENT_RISK_MESSAGE_MODAL_BODY_CLASS}
            onSubmit={(e) => {
              e.preventDefault();
              if (canSave && !saving) onSave();
            }}
          >
            <label className="block text-xs text-zinc-500 dark:text-zinc-400">
              Message shown to importers on the customer portal
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

          <div className={SHIPMENT_RISK_MESSAGE_MODAL_FOOTER_CLASS}>
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
          </div>
        </div>
      </div>
    </Reveal>,
    document.body,
  );
}
