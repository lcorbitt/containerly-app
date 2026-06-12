"use client";

import { FileDown, Loader2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { NewShipmentForm } from "@/components/NewShipmentForm";
import { ShipmentDataImportModal } from "@/components/NewShipmentForm/ShipmentDataImportModal";
import {
  NEW_SHIPMENT_MODAL_BULK_NO_ORG_OK_BUTTON_CLASS,
  NEW_SHIPMENT_MODAL_IMPORT_BUTTON_CLASS,
  NEW_SHIPMENT_MODAL_NO_ORG_MESSAGE_CLASS,
} from "./constants";
import type { NewShipmentBulkImportModalProps, NewShipmentModalProps } from "./types";

export function NewShipmentModal({
  open,
  onClose,
  selectedOrgId,
  creatingShipment,
  importOpen,
  onImportOpenChange,
  onCreated,
  onSwitchToBulkImport,
  onCreatingChange,
}: NewShipmentModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Shipment"
      size="4xl"
      busy={creatingShipment}
      headerActions={
        <button
          type="button"
          disabled={creatingShipment}
          onClick={() => onImportOpenChange(true)}
          className={NEW_SHIPMENT_MODAL_IMPORT_BUTTON_CLASS}
        >
          <FileDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Import
        </button>
      }
      overlay={
        creatingShipment ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/50 p-6 backdrop-blur-sm dark:bg-zinc-950/50"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-5 py-4 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary-orange" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Creating Shipment…</p>
              </div>
            </div>
          </div>
        ) : null
      }
    >
      {!selectedOrgId ? (
        <p className={NEW_SHIPMENT_MODAL_NO_ORG_MESSAGE_CLASS}>
          Select an organization in the header to create a shipment.
        </p>
      ) : (
        <NewShipmentForm
          organizationId={selectedOrgId}
          onCreated={onCreated}
          showChrome={false}
          importOpen={importOpen}
          onImportOpenChange={onImportOpenChange}
          onSwitchToBulkImport={onSwitchToBulkImport}
          onCreatingChange={onCreatingChange}
        />
      )}
    </Modal>
  );
}

export function NewShipmentBulkImportModal({
  open,
  onClose,
  selectedOrgId,
  onBulkComplete,
}: NewShipmentBulkImportModalProps) {
  if (selectedOrgId) {
    return (
      <ShipmentDataImportModal
        open={open}
        onClose={onClose}
        organizationId={selectedOrgId}
        variant="bulk"
        onBulkComplete={onBulkComplete}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" hideCloseButton ariaLabel="Bulk import">
      <p className={NEW_SHIPMENT_MODAL_NO_ORG_MESSAGE_CLASS}>
        Select an organization in the header to bulk import shipments.
      </p>
      <button type="button" onClick={onClose} className={NEW_SHIPMENT_MODAL_BULK_NO_ORG_OK_BUTTON_CLASS}>
        OK
      </button>
    </Modal>
  );
}
