import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShipmentTimelineDisplayEvent, ShipmentTimelineOrder } from "./types";
import { TIMELINE_ORDER_FADE_MS } from "./constants";

export function useShipmentTimelineOrder(events: ShipmentTimelineDisplayEvent[]): ShipmentTimelineOrder {
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

/** @deprecated Use useShipmentTimelineOrder */
export const useContainerTimelineOrder = useShipmentTimelineOrder;
