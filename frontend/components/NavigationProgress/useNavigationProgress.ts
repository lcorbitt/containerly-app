"use client";

import { useAtomValue } from "jotai";
import {
  navigationLoadingTextAtom,
  navigationProgressActionsAtom,
  navigationProgressIsNavigatingAtom,
  navigationProgressPhaseAtom,
} from "@/atoms/navigation-progress";

export function useNavigationProgress() {
  const phase = useAtomValue(navigationProgressPhaseAtom);
  const isNavigating = useAtomValue(navigationProgressIsNavigatingAtom);
  const loadingText = useAtomValue(navigationLoadingTextAtom);
  const actions = useAtomValue(navigationProgressActionsAtom);

  if (actions == null) {
    throw new Error("useNavigationProgress must be used within NavigationProgressHost");
  }

  return {
    phase,
    isNavigating,
    loadingText,
    startNavigation: actions.startNavigation,
    claimContentGate: actions.claimContentGate,
    releaseContentGate: actions.releaseContentGate,
  };
}
