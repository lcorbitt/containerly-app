"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import type { BulkImportResult } from "@/services/shipment-import.service";
import { emitTrackingCreated } from "@/utils/tracking-created-event";
import type { NewShipmentModalContextValue } from "./types";

export function useNewShipmentModalProvider() {
  const router = useRouter();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);

  const dismissModal = useCallback(() => {
    setOpen(false);
    setImportOpen(false);
  }, []);

  const close = useCallback(() => {
    if (creatingShipment) return;
    dismissModal();
  }, [creatingShipment, dismissModal]);

  const afterCreated = useCallback(
    async (shipmentId: string) => {
      emitTrackingCreated();
      await router.push(`/shipments/${shipmentId}`);
      dismissModal();
    },
    [router, dismissModal],
  );

  const openNewShipmentModal = useCallback(() => {
    setOpen(true);
  }, []);

  const openBulkImportModal = useCallback(() => {
    setBulkImportOpen(true);
  }, []);

  const switchToBulkImport = useCallback(() => {
    setImportOpen(false);
    setOpen(false);
    setBulkImportOpen(true);
  }, []);

  const closeBulkImport = useCallback(() => {
    setBulkImportOpen(false);
  }, []);

  const onBulkComplete = useCallback(
    (result: BulkImportResult) => {
      emitTrackingCreated();
      if (result.created.length > 0) {
        setBulkImportOpen(false);
        void router.push("/shipments");
        return;
      }
      router.refresh();
    },
    [router],
  );

  const contextValue = useMemo(
    (): NewShipmentModalContextValue => ({ openNewShipmentModal, openBulkImportModal }),
    [openNewShipmentModal, openBulkImportModal],
  );

  return {
    selectedOrgId,
    open,
    importOpen,
    bulkImportOpen,
    creatingShipment,
    contextValue,
    close,
    afterCreated,
    setImportOpen,
    setCreatingShipment,
    switchToBulkImport,
    closeBulkImport,
    onBulkComplete,
  };
}
