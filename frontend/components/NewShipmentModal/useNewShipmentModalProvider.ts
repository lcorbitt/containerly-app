"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { emitTrackingCreated } from "@/utils/tracking-created-event";
import type { NewShipmentModalContextValue } from "./types";

export function useNewShipmentModalProvider() {
  const router = useRouter();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

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

  const onBulkComplete = useCallback(() => {
    emitTrackingCreated();
    router.refresh();
  }, [router]);

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
  };
}
