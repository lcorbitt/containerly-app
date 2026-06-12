"use client";

import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  newShipmentBulkImportOpenAtom,
  newShipmentModalOpenAtom,
} from "@/atoms/new-shipment-modal";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import type { BulkImportResult } from "@/services/shipment-import.service";
import { emitTrackingCreated } from "@/utils/tracking-created-event";

export function useNewShipmentModal() {
  const router = useRouter();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [open, setOpen] = useAtom(newShipmentModalOpenAtom);
  const [bulkImportOpen, setBulkImportOpen] = useAtom(newShipmentBulkImportOpenAtom);
  const [importOpen, setImportOpen] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);

  const dismissModal = useCallback(() => {
    setOpen(false);
    setImportOpen(false);
  }, [setOpen]);

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

  const switchToBulkImport = useCallback(() => {
    setImportOpen(false);
    setOpen(false);
    setBulkImportOpen(true);
  }, [setOpen, setBulkImportOpen]);

  const closeBulkImport = useCallback(() => {
    setBulkImportOpen(false);
  }, [setBulkImportOpen]);

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
    [router, setBulkImportOpen],
  );

  return {
    selectedOrgId,
    open,
    importOpen,
    bulkImportOpen,
    creatingShipment,
    close,
    afterCreated,
    setImportOpen,
    setCreatingShipment,
    switchToBulkImport,
    closeBulkImport,
    onBulkComplete,
  };
}
