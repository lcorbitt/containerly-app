"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { Reveal } from "@/components/Reveal";
import { ShipmentDocumentUploadZone } from "../index";
import {
  SHIPMENT_DOCUMENT_UPLOAD_MODAL_BACKDROP_CLASS,
  SHIPMENT_DOCUMENT_UPLOAD_MODAL_BODY_CLASS,
  SHIPMENT_DOCUMENT_UPLOAD_MODAL_HEADER_CLASS,
  SHIPMENT_DOCUMENT_UPLOAD_MODAL_PANEL_CLASS,
  SHIPMENT_DOCUMENT_UPLOAD_MODAL_REVEAL_CLASS,
  SHIPMENT_DOCUMENT_UPLOAD_MODAL_SHELL_CLASS,
  SHIPMENT_DOCUMENT_UPLOAD_MODAL_TITLE_CLASS,
} from "./constants";
import type { ShipmentDocumentUploadModalProps } from "./types";

export function ShipmentDocumentUploadModal({
  open,
  onClose,
  uploading = false,
  ...uploadZoneProps
}: ShipmentDocumentUploadModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !uploading) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, uploading]);

  if (!portalReady || typeof document === "undefined") return null;

  return createPortal(
    <Reveal show={open} className={SHIPMENT_DOCUMENT_UPLOAD_MODAL_REVEAL_CLASS}>
      <div className={SHIPMENT_DOCUMENT_UPLOAD_MODAL_SHELL_CLASS}>
        <button
          type="button"
          aria-label="Close dialog"
          className={SHIPMENT_DOCUMENT_UPLOAD_MODAL_BACKDROP_CLASS}
          onClick={() => {
            if (!uploading) onClose();
          }}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={SHIPMENT_DOCUMENT_UPLOAD_MODAL_PANEL_CLASS}
        >
          <div className={SHIPMENT_DOCUMENT_UPLOAD_MODAL_HEADER_CLASS}>
            <h2 id={titleId} className={SHIPMENT_DOCUMENT_UPLOAD_MODAL_TITLE_CLASS}>
              Upload Documents
            </h2>
            <DialogCloseButton
              onClick={() => {
                if (!uploading) onClose();
              }}
              disabled={uploading}
            />
          </div>
          <div className={SHIPMENT_DOCUMENT_UPLOAD_MODAL_BODY_CLASS}>
            <ShipmentDocumentUploadZone uploading={uploading} {...uploadZoneProps} />
          </div>
        </div>
      </div>
    </Reveal>,
    document.body,
  );
}
