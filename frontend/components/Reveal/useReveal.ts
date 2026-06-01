"use client";

import { useEffect, useRef, useState } from "react";
import { REVEAL_DURATION_MS } from "./constants";

export function useReveal(show: boolean, durationMs = REVEAL_DURATION_MS, keepMounted = false) {
  const [mounted, setMounted] = useState(show || keepMounted);
  const [visible, setVisible] = useState(false);
  const wasMountedRef = useRef(show || keepMounted);

  useEffect(() => {
    const generation = Symbol("reveal-phase");
    let activeGeneration: symbol | null = generation;
    let enterOuterFrame = 0;
    let enterInnerFrame = 0;
    let exitFrame = 0;
    let exitTimer = 0;

    const isActive = () => activeGeneration === generation;

    const clearEnter = () => {
      cancelAnimationFrame(enterOuterFrame);
      cancelAnimationFrame(enterInnerFrame);
      enterOuterFrame = 0;
      enterInnerFrame = 0;
    };

    const clearExit = () => {
      cancelAnimationFrame(exitFrame);
      if (exitTimer) {
        window.clearTimeout(exitTimer);
        exitTimer = 0;
      }
    };

    const cancelAll = () => {
      activeGeneration = null;
      clearEnter();
      clearExit();
    };

    if (show) {
      clearExit();
      wasMountedRef.current = true;

      enterOuterFrame = requestAnimationFrame(() => {
        if (!isActive()) return;
        setMounted(true);
        setVisible(false);

        enterInnerFrame = requestAnimationFrame(() => {
          if (!isActive()) return;
          setVisible(true);
        });
      });

      return cancelAll;
    }

    clearEnter();

    exitFrame = requestAnimationFrame(() => {
      if (!isActive()) return;
      setVisible(false);

      if (!wasMountedRef.current) {
        return;
      }

      if (keepMounted) {
        return;
      }

      exitTimer = window.setTimeout(() => {
        if (!isActive()) return;
        wasMountedRef.current = false;
        setMounted(false);
      }, durationMs);
    });

    return cancelAll;
  }, [show, durationMs, keepMounted]);

  return { mounted, visible };
}
