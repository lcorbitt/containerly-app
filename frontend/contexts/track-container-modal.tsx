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
import { useRouter } from "next/navigation";
import { BolImportDialog } from "@/components/BolImportDialog";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { NewTrackingForm } from "@/components/NewTrackingForm";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { emitTrackingCreated } from "@/utils/tracking-created-event";

type TrackContainerModalContextValue = {
  openTrackContainerModal: () => void;
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
  const [bolOpen, setBolOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setBolOpen(false);
  }, []);

  const afterTracked = useCallback(() => {
    emitTrackingCreated();
    router.refresh();
    close();
  }, [router, close]);

  const afterBolImported = useCallback(() => {
    emitTrackingCreated();
    router.refresh();
    setBolOpen(false);
    close();
  }, [router, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !bolOpen) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, bolOpen, close]);

  const openTrackContainerModal = useCallback(() => {
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openTrackContainerModal }),
    [openTrackContainerModal],
  );

  return (
    <TrackContainerModalContext.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px] transition-opacity dark:bg-black/70"
            onClick={() => !bolOpen && close()}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative z-101 m-0 mt-0 w-full max-w-lg border-0 border-zinc-200 bg-white shadow-2xl outline-none dark:border-zinc-700 dark:bg-zinc-950 sm:rounded-2xl sm:border sm:shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2
                id={titleId}
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                Track a container
              </h2>
              <DialogCloseButton onClick={close} />
            </div>
            <div className="px-5 py-4">
              {!selectedOrgId ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Select an organization in the header to add tracking.
                </p>
              ) : (
                <NewTrackingForm
                  organizationId={selectedOrgId}
                  onCreated={afterTracked}
                  onOpenBolImport={() => setBolOpen(true)}
                  showChrome={false}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
      {selectedOrgId ? (
        <BolImportDialog
          open={bolOpen}
          onClose={() => setBolOpen(false)}
          organizationId={selectedOrgId}
          onImported={afterBolImported}
          stackZIndex="z-[110]"
        />
      ) : null}
    </TrackContainerModalContext.Provider>
  );
}
