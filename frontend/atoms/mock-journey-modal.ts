"use client";

import { atom, useSetAtom } from "jotai";
import { useCallback } from "react";

export const mockJourneyModalOpenAtom = atom(false);

export function useMockJourneyModal() {
  const setOpen = useSetAtom(mockJourneyModalOpenAtom);

  const openMockJourneyModal = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  return { openMockJourneyModal };
}
