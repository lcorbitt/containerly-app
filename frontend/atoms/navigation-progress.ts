"use client";

import { atom } from "jotai";
import type { NavigationProgressPhase } from "@/components/NavigationProgress/types";
import type { NavigationStartInput } from "@/components/NavigationProgress/resolve-navigation-start";

export interface NavigationProgressActions {
  startNavigation: (input?: NavigationStartInput) => void;
  claimContentGate: () => void;
  releaseContentGate: (options: { ready: boolean }) => void;
}

export const navigationProgressPhaseAtom = atom<NavigationProgressPhase>("idle");

export const navigationPendingAtom = atom(false);

export const navigationLoadingTextAtom = atom<string | null>(null);

export const navigationProgressActionsAtom = atom<NavigationProgressActions | null>(null);

export const navigationProgressIsNavigatingAtom = atom((get) => {
  const phase = get(navigationProgressPhaseAtom);
  const pending = get(navigationPendingAtom);
  return pending || phase !== "idle";
});
