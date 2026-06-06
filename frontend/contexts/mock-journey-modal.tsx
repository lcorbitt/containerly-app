"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mockJourneyModalOpenAtom } from "@/atoms/mock-journey-modal";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { MockJourneySimulator } from "@/components/MockJourneySimulator";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { fetchRecentTrackingRequestsForOrganization } from "@/services/tracking.service";
import type { TrackingRequest } from "@/types/database";
import { emitTrackingCreated } from "@/utils/tracking-created-event";

export { useMockJourneyModal } from "@/atoms/mock-journey-modal";

export function MockJourneyModalHost({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [open, setOpen] = useAtom(mockJourneyModalOpenAtom);
  const [requests, setRequests] = useState<TrackingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const loadRequests = useCallback(async () => {
    if (!selectedOrgId) {
      setRequests([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchRecentTrackingRequestsForOrganization(selectedOrgId);
      setRequests(rows);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (!open) return;
    void loadRequests();
  }, [open, loadRequests]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const afterComplete = useCallback(() => {
    emitTrackingCreated();
    void loadRequests();
    router.refresh();
  }, [router, loadRequests]);

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

  return (
    <>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px] transition-opacity dark:bg-black/70"
            onClick={close}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative z-[101] m-0 mt-0 w-full max-w-lg border-0 border-zinc-200 bg-white shadow-2xl outline-none dark:border-zinc-700 dark:bg-zinc-950 sm:rounded-2xl sm:border sm:shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2
                id={titleId}
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                Simulate journey
                <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">(dev)</span>
              </h2>
              <DialogCloseButton onClick={close} />
            </div>
            <div className="px-5 py-4">
              {!selectedOrgId ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Select an organization in the header to run the mock journey simulator.
                </p>
              ) : loading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading tracking requests…</p>
              ) : (
                <MockJourneySimulator
                  organizationId={selectedOrgId}
                  requests={requests}
                  onComplete={afterComplete}
                  showChrome={false}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
