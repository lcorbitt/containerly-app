"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { mockJourneyModalOpenAtom } from "@/atoms/mock-journey-modal";
import { Modal } from "@/components/Modal";
import { MockJourneySimulator } from "@/components/MockJourneySimulator";
import { fetchRecentTrackingRequestsForOrganization } from "@/services/tracking.service";
import type { TrackingRequest } from "@/types/database";
import { emitTrackingCreated } from "@/utils/tracking-created-event";

export { useMockJourneyModalControls } from "@/atoms/mock-journey-modal";

export function MockJourneyModalHost({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [open, setOpen] = useAtom(mockJourneyModalOpenAtom);
  const [requests, setRequests] = useState<TrackingRequest[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      {children}
      <Modal
        open={open}
        onClose={close}
        title={
          <>
            Simulate journey
            <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">(dev)</span>
          </>
        }
      >
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
      </Modal>
    </>
  );
}
