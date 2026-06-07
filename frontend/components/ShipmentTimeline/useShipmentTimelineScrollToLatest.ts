"use client";

import { useLayoutEffect, useRef } from "react";
import type { ShipmentTimelineDisplayEvent } from "./types";
import { getLatestTimelineEventId, scrollTimelineEventIntoView } from "./utils";

interface ScrollPendingState {
  baselineLatestId: string | null;
  baselineCount: number;
}

export function useShipmentTimelineScrollToLatest({
  displayEvents,
  scrollToLatestNonce,
}: {
  displayEvents: ShipmentTimelineDisplayEvent[];
  scrollToLatestNonce?: number;
}) {
  const displayEventsRef = useRef(displayEvents);
  displayEventsRef.current = displayEvents;
  const pendingRef = useRef<ScrollPendingState | null>(null);

  useLayoutEffect(() => {
    if (!scrollToLatestNonce) return;
    pendingRef.current = {
      baselineLatestId: getLatestTimelineEventId(displayEventsRef.current),
      baselineCount: displayEventsRef.current.length,
    };
  }, [scrollToLatestNonce]);

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending || displayEvents.length === 0) return;

    const latestId = getLatestTimelineEventId(displayEvents);
    if (!latestId) return;

    const eventsUpdated =
      displayEvents.length > pending.baselineCount || latestId !== pending.baselineLatestId;
    if (!eventsUpdated) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollTimelineEventIntoView(latestId, reduced ? "auto" : "smooth");
    pendingRef.current = null;
  }, [displayEvents]);
}
