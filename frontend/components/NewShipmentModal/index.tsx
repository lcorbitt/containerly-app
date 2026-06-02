"use client";

import { createPortal } from "react-dom";
import { FileDown, Loader2 } from "lucide-react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { NewShipmentForm } from "@/components/NewShipmentForm";
import { ShipmentDataImportModal } from "@/components/NewShipmentForm/ShipmentDataImportModal";
import {
  SHIPMENT_DATA_IMPORT_MODAL_BACKDROP_CLASS,
  SHIPMENT_DATA_IMPORT_MODAL_REVEAL_CLASS,
  SHIPMENT_DATA_IMPORT_MODAL_SHELL_CLASS,
} from "@/components/NewShipmentForm/ShipmentDataImportModal/constants";
import { Reveal } from "@/components/Reveal";
import {
  NEW_SHIPMENT_MODAL_BACKDROP_CLASS,
  NEW_SHIPMENT_MODAL_BODY_CLASS,
  NEW_SHIPMENT_MODAL_BULK_NO_ORG_OK_BUTTON_CLASS,
  NEW_SHIPMENT_MODAL_BULK_NO_ORG_PANEL_CLASS,
  NEW_SHIPMENT_MODAL_HEADER_ACTIONS_CLASS,
  NEW_SHIPMENT_MODAL_HEADER_CLASS,
  NEW_SHIPMENT_MODAL_IMPORT_BUTTON_CLASS,
  NEW_SHIPMENT_MODAL_NO_ORG_MESSAGE_CLASS,
  NEW_SHIPMENT_MODAL_PANEL_CLASS,
  NEW_SHIPMENT_MODAL_REVEAL_CLASS,
  NEW_SHIPMENT_MODAL_SHELL_CLASS,
  NEW_SHIPMENT_MODAL_TITLE_CLASS,
} from "./constants";
import { NewShipmentModalContext } from "./useNewShipmentModal";
import { useNewShipmentModalProvider } from "./useNewShipmentModalProvider";

export { useNewShipmentModal } from "./useNewShipmentModal";
export type { NewShipmentModalContextValue } from "./types";

export function NewShipmentModalProvider({ children }: { children: React.ReactNode }) {
  const {
    selectedOrgId,
    open,
    importOpen,
    bulkImportOpen,
    creatingShipment,
    portalReady,
    titleId,
    panelRef,
    contextValue,
    close,
    afterCreated,
    setImportOpen,
    setCreatingShipment,
    switchToBulkImport,
    closeBulkImport,
    onBulkComplete,
  } = useNewShipmentModalProvider();

  const newShipmentModal =
    portalReady && typeof document !== "undefined"
      ? createPortal(
          <Reveal show={open} className={NEW_SHIPMENT_MODAL_REVEAL_CLASS}>
            <div className={NEW_SHIPMENT_MODAL_SHELL_CLASS}>
              <button
                type="button"
                aria-label="Close dialog"
                className={NEW_SHIPMENT_MODAL_BACKDROP_CLASS}
                onClick={close}
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={NEW_SHIPMENT_MODAL_PANEL_CLASS}
              >
                <div className="relative">
                  <div
                    className={`transition-[filter,opacity] ${
                      creatingShipment ? "pointer-events-none blur-[2px] opacity-60" : ""
                    }`}
                  >
                    <div className={NEW_SHIPMENT_MODAL_HEADER_CLASS}>
                      <div className="min-w-0">
                        <h2 id={titleId} className={NEW_SHIPMENT_MODAL_TITLE_CLASS}>
                          New Shipment
                        </h2>
                      </div>
                      <div className={NEW_SHIPMENT_MODAL_HEADER_ACTIONS_CLASS}>
                        <button
                          type="button"
                          disabled={creatingShipment}
                          onClick={() => setImportOpen(true)}
                          className={NEW_SHIPMENT_MODAL_IMPORT_BUTTON_CLASS}
                        >
                          <FileDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                          Import
                        </button>
                        <DialogCloseButton onClick={close} disabled={creatingShipment} />
                      </div>
                    </div>
                    <div className={NEW_SHIPMENT_MODAL_BODY_CLASS}>
                      {!selectedOrgId ? (
                        <p className={NEW_SHIPMENT_MODAL_NO_ORG_MESSAGE_CLASS}>
                          Select an organization in the header to create a shipment.
                        </p>
                      ) : (
                        <NewShipmentForm
                          organizationId={selectedOrgId}
                          onCreated={afterCreated}
                          showChrome={false}
                          importOpen={importOpen}
                          onImportOpenChange={setImportOpen}
                          onSwitchToBulkImport={switchToBulkImport}
                          onCreatingChange={setCreatingShipment}
                        />
                      )}
                    </div>
                  </div>

                  {creatingShipment ? (
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
                  ) : null}
                </div>
              </div>
            </div>
          </Reveal>,
          document.body,
        )
      : null;

  const bulkImportModal = selectedOrgId ? (
    <ShipmentDataImportModal
      open={bulkImportOpen}
      onClose={closeBulkImport}
      organizationId={selectedOrgId}
      variant="bulk"
      onBulkComplete={onBulkComplete}
    />
  ) : (
    portalReady &&
    typeof document !== "undefined" &&
    createPortal(
      <Reveal show={bulkImportOpen} className={SHIPMENT_DATA_IMPORT_MODAL_REVEAL_CLASS}>
        <div className={SHIPMENT_DATA_IMPORT_MODAL_SHELL_CLASS}>
          <button
            type="button"
            aria-label="Close dialog"
            className={SHIPMENT_DATA_IMPORT_MODAL_BACKDROP_CLASS}
            onClick={closeBulkImport}
          />
          <div role="dialog" aria-modal="true" className={NEW_SHIPMENT_MODAL_BULK_NO_ORG_PANEL_CLASS}>
            <p className={NEW_SHIPMENT_MODAL_NO_ORG_MESSAGE_CLASS}>
              Select an organization in the header to bulk import shipments.
            </p>
            <button type="button" onClick={closeBulkImport} className={NEW_SHIPMENT_MODAL_BULK_NO_ORG_OK_BUTTON_CLASS}>
              OK
            </button>
          </div>
        </div>
      </Reveal>,
      document.body,
    )
  );

  return (
    <NewShipmentModalContext.Provider value={contextValue}>
      {children}
      {newShipmentModal}
      {bulkImportModal}
    </NewShipmentModalContext.Provider>
  );
}
