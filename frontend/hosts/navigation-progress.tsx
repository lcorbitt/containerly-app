"use client";

import { useAtomValue } from "jotai";
import {
  NAVIGATION_PROGRESS_ACTIVE_CLASS,
  NAVIGATION_PROGRESS_COMPLETING_CLASS,
  NAVIGATION_PROGRESS_HIDDEN_CLASS,
  NAVIGATION_PROGRESS_SHELL_CLASS,
  NAVIGATION_PROGRESS_TRACK_CLASS,
} from "@/components/NavigationProgress/constants";
import { useNavigationProgressHost } from "@/components/NavigationProgress/useNavigationProgressHost";
import type { NavigationProgressPhase } from "@/components/NavigationProgress/types";
import { navigationProgressPhaseAtom } from "@/atoms/navigation-progress";

export function NavigationProgressHost({ children }: { children: React.ReactNode }) {
  useNavigationProgressHost();
  const phase = useAtomValue(navigationProgressPhaseAtom);

  return (
    <>
      {children}
      <NavigationProgressBar phase={phase} />
    </>
  );
}

function NavigationProgressBar({ phase }: { phase: NavigationProgressPhase }) {
  const trackClassName =
    phase === "active"
      ? `${NAVIGATION_PROGRESS_TRACK_CLASS} ${NAVIGATION_PROGRESS_ACTIVE_CLASS}`
      : phase === "completing"
        ? `${NAVIGATION_PROGRESS_TRACK_CLASS} ${NAVIGATION_PROGRESS_COMPLETING_CLASS} scale-x-100`
        : `${NAVIGATION_PROGRESS_TRACK_CLASS} ${NAVIGATION_PROGRESS_HIDDEN_CLASS}`;

  return (
    <div
      className={NAVIGATION_PROGRESS_SHELL_CLASS}
      role="progressbar"
      aria-hidden={phase === "idle"}
      aria-busy={phase !== "idle"}
    >
      <div className={trackClassName} />
    </div>
  );
}
