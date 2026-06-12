"use client";

import { atom, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useCallback } from "react";

export const WELCOME_MODAL_DISMISSED_STORAGE_KEY = "containerly_welcome_dismissed_user_ids";

export const welcomeModalOpenAtom = atom(false);

/** User ids that have dismissed the post-signup welcome modal. */
export const welcomeModalDismissedUserIdsAtom = atomWithStorage<string[]>(
  WELCOME_MODAL_DISMISSED_STORAGE_KEY,
  [],
);

export function useWelcomeModalControls() {
  const setOpen = useSetAtom(welcomeModalOpenAtom);

  const openWelcomeModal = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  return { openWelcomeModal };
}
