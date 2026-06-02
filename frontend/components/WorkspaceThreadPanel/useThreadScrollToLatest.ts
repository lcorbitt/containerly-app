"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { flushScrollThreadToLatest } from "./utils";

export function useThreadScrollToLatest({
  messagesScrollRef,
  messagesEndRef,
  messageCount,
  pinToLatest,
}: {
  messagesScrollRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messageCount: number;
  /** When true, keep the viewport pinned to the newest message (tab visible, deep link, etc.). */
  pinToLatest: boolean;
}) {
  const prevMessageCountRef = useRef<number | null>(null);
  const prevPinRef = useRef(pinToLatest);

  const scrollToLatest = useCallback(
    (behavior: ScrollBehavior) => {
      flushScrollThreadToLatest(
        messagesScrollRef.current,
        messagesEndRef.current,
        behavior,
      );
    },
    [messagesEndRef, messagesScrollRef],
  );

  useLayoutEffect(() => {
    if (!pinToLatest) {
      prevPinRef.current = false;
      return;
    }

    if (messageCount === 0) {
      prevMessageCountRef.current = messageCount;
      prevPinRef.current = pinToLatest;
      return;
    }

    const previousCount = prevMessageCountRef.current;
    const pinJustEnabled = pinToLatest && !prevPinRef.current;

    if (previousCount === null || messageCount > previousCount || pinJustEnabled) {
      const behavior =
        previousCount === null || pinJustEnabled ? "auto" : "smooth";
      scrollToLatest(behavior);
    }

    prevMessageCountRef.current = messageCount;
    prevPinRef.current = pinToLatest;
  }, [messageCount, pinToLatest, scrollToLatest]);
}
