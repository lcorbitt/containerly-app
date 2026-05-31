"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FileDown } from "lucide-react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { NewShipmentForm } from "@/components/NewShipmentForm";
import { ShipmentDataImportModal } from "@/components/NewShipmentForm/ShipmentDataImportModal";
import {
  SHIPMENT_DATA_IMPORT_MODAL_BACKDROP_CLASS,
  SHIPMENT_DATA_IMPORT_MODAL_REVEAL_CLASS,
  SHIPMENT_DATA_IMPORT_MODAL_SHELL_CLASS,
} from "@/components/NewShipmentForm/ShipmentDataImportModal/constants";
import { Reveal } from "@/components/Reveal";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { emitTrackingCreated } from "@/utils/tracking-created-event";

const NEW_SHIPMENT_MODAL_REVEAL_CLASS = "fixed inset-0 z-[100]";

const NEW_SHIPMENT_MODAL_SHELL_CLASS =
  "relative flex h-full min-h-0 w-full items-start justify-center overflow-y-auto sm:items-center sm:p-4";

const NEW_SHIPMENT_MODAL_BACKDROP_CLASS =
  "absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] dark:bg-black/70";

type TrackContainerModalContextValue = {
  openTrackContainerModal: () => void;
  openBulkImportModal: () => void;
};

const TrackContainerModalContext = createContext<TrackContainerModalContextValue | null>(null);

export function useTrackContainerModal(): TrackContainerModalContextValue {
  const ctx = useContext(TrackContainerModalContext);
  if (!ctx) {
    throw new Error("useTrackContainerModal must be used within TrackContainerModalProvider");
  }
  return ctx;
}

export function TrackContainerModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setImportOpen(false);
  }, []);

  const afterCreated = useCallback(
    (shipmentId: string) => {
      router.push(`/shipments/${shipmentId}`);
      router.refresh();
      close();
    },
    [router, close],
  );

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const openTrackContainerModal = useCallback(() => {
    setOpen(true);
  }, []);

  const openBulkImportModal = useCallback(() => {
    setBulkImportOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openTrackContainerModal, openBulkImportModal }),
    [openTrackContainerModal, openBulkImportModal],
  );

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
                className="relative z-[101] m-0 mt-0 w-full max-w-4xl border-0 border-zinc-200 bg-white shadow-2xl outline-none dark:border-zinc-700 dark:bg-zinc-950 sm:rounded-2xl sm:border sm:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                  <div className="min-w-0">
                    <h2
                      id={titleId}
                      className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                    >
                      New shipment
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImportOpen(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      <FileDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Import
                    </button>
                    <DialogCloseButton onClick={close} />
                  </div>
                </div>
                <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
                  {!selectedOrgId ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Select an organization in the header to create a shipment.
                    </p>
                  ) : (
                    <NewShipmentForm
                      organizationId={selectedOrgId}
                      onCreated={afterCreated}
                      showChrome={false}
                      importOpen={importOpen}
                      onImportOpenChange={setImportOpen}
                    />
                  )}
                </div>
              </div>
            </div>
          </Reveal>,
          document.body,
        )
      : null;

  return (
    <TrackContainerModalContext.Provider value={value}>
      {children}
      {newShipmentModal}
      {selectedOrgId ? (
        <ShipmentDataImportModal
          open={bulkImportOpen}
          onClose={() => setBulkImportOpen(false)}
          organizationId={selectedOrgId}
          variant="bulk"
          onBulkComplete={() => {
            emitTrackingCreated();
            router.refresh();
          }}
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
                onClick={() => setBulkImportOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                className="relative z-[111] w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Select an organization in the header to bulk import shipments.
                </p>
                <button
                  type="button"
                  onClick={() => setBulkImportOpen(false)}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  OK
                </button>
              </div>
            </div>
          </Reveal>,
          document.body,
        )
      )}
    </TrackContainerModalContext.Provider>
  );
}
