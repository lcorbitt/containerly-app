"use client";

import { useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  navigationLoadingTextAtom,
  navigationPendingAtom,
  navigationProgressActionsAtom,
  navigationProgressPhaseAtom,
} from "@/atoms/navigation-progress";
import {
  NAVIGATION_PROGRESS_COMPLETE_MS,
  NAVIGATION_PROGRESS_GATE_GRACE_MS,
  NAVIGATION_PROGRESS_SAFETY_MS,
  NAVIGATION_PROGRESS_SHOW_DELAY_MS,
} from "@/components/NavigationProgress/constants";
import {
  navigationStartInputFromAnchor,
  resolveNavigationLoadingText,
} from "@/components/NavigationProgress/resolve-navigation-start";
import type { NavigationStartInput } from "@/components/NavigationProgress/resolve-navigation-start";
import type { NavigationProgressPhase } from "@/components/NavigationProgress/types";
import { shouldStartNavigationFromAnchor } from "@/components/NavigationProgress/utils";

export function useNavigationProgressHost() {
  const pathname = usePathname();
  const setPhase = useSetAtom(navigationProgressPhaseAtom);
  const setPendingNavigation = useSetAtom(navigationPendingAtom);
  const setLoadingText = useSetAtom(navigationLoadingTextAtom);
  const setActions = useSetAtom(navigationProgressActionsAtom);

  const showTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const graceTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const pendingStartRef = useRef(false);
  const gateCountRef = useRef(0);
  const previousPathnameRef = useRef(pathname);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current != null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const clearGraceTimer = useCallback(() => {
    if (graceTimerRef.current != null) {
      window.clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current != null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finishNavigation = useCallback(() => {
    clearShowTimer();
    clearGraceTimer();
    clearSafetyTimer();
    pendingStartRef.current = false;
    setPendingNavigation(false);
    setLoadingText(null);
    setPhase((current: NavigationProgressPhase) => {
      if (current === "idle") return "idle";
      return "completing";
    });
    clearCompleteTimer();
    completeTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
      completeTimerRef.current = null;
    }, NAVIGATION_PROGRESS_COMPLETE_MS);
  }, [
    clearCompleteTimer,
    clearGraceTimer,
    clearSafetyTimer,
    clearShowTimer,
    setLoadingText,
    setPendingNavigation,
    setPhase,
  ]);

  const startNavigation = useCallback(
    (input?: NavigationStartInput) => {
      pendingStartRef.current = true;
      setPendingNavigation(true);
      setLoadingText(resolveNavigationLoadingText(input));
      clearShowTimer();
      showTimerRef.current = window.setTimeout(() => {
        if (!pendingStartRef.current) return;
        setPhase("active");
        showTimerRef.current = null;
      }, NAVIGATION_PROGRESS_SHOW_DELAY_MS);
      clearSafetyTimer();
      safetyTimerRef.current = window.setTimeout(() => {
        finishNavigation();
      }, NAVIGATION_PROGRESS_SAFETY_MS);
    },
    [clearSafetyTimer, clearShowTimer, finishNavigation, setLoadingText, setPendingNavigation, setPhase],
  );

  const claimContentGate = useCallback(() => {
    gateCountRef.current += 1;
    clearGraceTimer();
  }, [clearGraceTimer]);

  const releaseContentGate = useCallback(
    ({ ready }: { ready: boolean }) => {
      if (gateCountRef.current > 0) gateCountRef.current -= 1;
      if (ready && gateCountRef.current === 0 && pendingStartRef.current) {
        finishNavigation();
      }
    },
    [finishNavigation],
  );

  const actions = useMemo(
    () => ({
      startNavigation,
      claimContentGate,
      releaseContentGate,
    }),
    [claimContentGate, releaseContentGate, startNavigation],
  );

  // Register before descendants render; useEffect would run too late for useNavigationProgress consumers.
  setActions(actions);

  useEffect(() => {
    return () => setActions(null);
  }, [setActions]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;

    if (!pendingStartRef.current) {
      finishNavigation();
      return;
    }

    if (gateCountRef.current > 0) return;
    clearGraceTimer();
    graceTimerRef.current = window.setTimeout(() => {
      graceTimerRef.current = null;
      if (gateCountRef.current > 0) return;
      finishNavigation();
    }, NAVIGATION_PROGRESS_GATE_GRACE_MS);
  }, [clearGraceTimer, finishNavigation, pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!shouldStartNavigationFromAnchor(anchor)) return;

      startNavigation(navigationStartInputFromAnchor(anchor));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startNavigation]);

  useEffect(
    () => () => {
      clearShowTimer();
      clearCompleteTimer();
      clearGraceTimer();
      clearSafetyTimer();
    },
    [clearCompleteTimer, clearGraceTimer, clearSafetyTimer, clearShowTimer],
  );
}
