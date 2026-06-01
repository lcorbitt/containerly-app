"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

function scrollTimelineEndIntoView(
  endEl: HTMLElement,
  newestFirst: boolean,
  behavior: ScrollBehavior,
) {
  endEl.scrollIntoView({
    block: newestFirst ? "start" : "end",
    behavior,
    inline: "nearest",
  });
}

/** Instant scroll to latest milestone when the tab opens; smooth scroll when new events arrive. */
export function useTimelineAutoScroll({
  enabled,
  isActive,
  eventCount,
  orderFadeOut,
  newestFirst,
  endRef,
}: {
  enabled: boolean;
  isActive: boolean;
  eventCount: number;
  orderFadeOut: boolean;
  newestFirst: boolean;
  endRef: RefObject<HTMLElement | null>;
}) {
  const prevEventCountRef = useRef<number | null>(null);
  const wasActiveRef = useRef(false);

  useLayoutEffect(() => {
    if (!enabled || !isActive || eventCount === 0 || orderFadeOut) {
      if (!isActive) wasActiveRef.current = false;
      return;
    }

    const tabJustActivated = isActive && !wasActiveRef.current;
    wasActiveRef.current = true;

    const scrollToLatest = (behavior: ScrollBehavior) => {
      const endEl = endRef.current;
      if (!endEl) return;
      scrollTimelineEndIntoView(endEl, newestFirst, behavior);
    };

    const previousCount = prevEventCountRef.current;

    if (previousCount === null || tabJustActivated) {
      prevEventCountRef.current = eventCount;
      scrollToLatest("auto");
      requestAnimationFrame(() => scrollToLatest("auto"));
      return;
    }

    if (eventCount > previousCount) {
      scrollToLatest("smooth");
    }

    prevEventCountRef.current = eventCount;
  }, [enabled, isActive, eventCount, orderFadeOut, newestFirst, endRef]);
}
