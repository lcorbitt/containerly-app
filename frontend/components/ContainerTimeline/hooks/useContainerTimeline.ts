import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicTimelineEvent } from "@/types/public-report";
import type { ContainerTimelineOrder } from "../types";
import { TIMELINE_ORDER_FADE_MS } from "../constants";

export function useContainerTimelineOrder(events: PublicTimelineEvent[]): ContainerTimelineOrder {
  const [newestFirst, setNewestFirst] = useState(false);
  const [listNewestFirst, setListNewestFirst] = useState(false);
  const [orderFadeOut, setOrderFadeOut] = useState(false);

  const displayEvents = useMemo(
    () => (listNewestFirst ? [...events].reverse() : events),
    [events, listNewestFirst],
  );

  useEffect(() => {
    if (!orderFadeOut) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduced ? 0 : TIMELINE_ORDER_FADE_MS;
    const id = window.setTimeout(() => {
      setListNewestFirst(newestFirst);
      setOrderFadeOut(false);
    }, ms);
    return () => window.clearTimeout(id);
  }, [orderFadeOut, newestFirst]);

  const handleOrderToggle = useCallback(() => {
    setNewestFirst((v) => !v);
    setOrderFadeOut(true);
  }, []);

  return { newestFirst, displayEvents, orderFadeOut, handleOrderToggle };
}
