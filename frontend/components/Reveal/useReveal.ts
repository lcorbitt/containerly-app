"use client";

import { useEffect, useRef, useState } from "react";
import { REVEAL_DURATION_MS } from "./constants";

export function useReveal(show: boolean, durationMs = REVEAL_DURATION_MS) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;

  useEffect(() => {
    const generation = Symbol("reveal-phase");
    let activeGeneration: symbol | null = generation;
    let enterOuterFrame = 0;
    let enterInnerFrame = 0;
    let exitTimer = 0;

    const isActive = () => activeGeneration === generation;

    const clearEnter = () => {
      cancelAnimationFrame(enterOuterFrame);
      cancelAnimationFrame(enterInnerFrame);
      enterOuterFrame = 0;
      enterInnerFrame = 0;
    };

    const clearExit = () => {
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
      setMounted(true);
      setVisible(false);

      enterOuterFrame = requestAnimationFrame(() => {
        enterInnerFrame = requestAnimationFrame(() => {
          if (!isActive()) return;
          setVisible(true);
        });
      });

      return cancelAll;
    }

    clearEnter();
    setVisible(false);

    if (!mountedRef.current) {
      return cancelAll;
    }

    exitTimer = window.setTimeout(() => {
      if (!isActive()) return;
      setMounted(false);
    }, durationMs);

    return cancelAll;
  }, [show, durationMs]);

  return { mounted, visible };
}
