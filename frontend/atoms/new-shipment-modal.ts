"use client";

import { atom, useSetAtom } from "jotai";
import { useCallback } from "react";

export const newShipmentModalOpenAtom = atom(false);
export const newShipmentBulkImportOpenAtom = atom(false);

export function useNewShipmentModalControls() {
  const setOpen = useSetAtom(newShipmentModalOpenAtom);
  const setBulkOpen = useSetAtom(newShipmentBulkImportOpenAtom);

  const openNewShipmentModal = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const openBulkImportModal = useCallback(() => {
    setBulkOpen(true);
  }, [setBulkOpen]);

  return { openNewShipmentModal, openBulkImportModal };
}
