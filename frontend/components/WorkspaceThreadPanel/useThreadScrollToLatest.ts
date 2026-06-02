"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { WORKSPACE_TABS_SECTION_ID } from "@/components/WorkspaceTabShell/constants";
import { THREAD_PANEL_COMPOSER_ID } from "./constants";
import { flushScrollMessagesTabChromeIntoView, flushScrollThreadToLatest } from "./utils";

export function useThreadScrollToLatest({
  messagesScrollRef,
  messagesEndRef,
  messageCount,
  pinToLatest,
  scrollComposerIntoView = false,
}: {
  messagesScrollRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messageCount: number;
  /** When true, keep the viewport pinned to the newest message (tab visible, deep link, etc.). */
  pinToLatest: boolean;
  /** Also scroll the document so the tabs card / composer are visible (shipment `?tab=messages`). */
  scrollComposerIntoView?: boolean;
}) {
  const prevMessageCountRef = useRef<number | null>(null);
  const prevPinRef = useRef(pinToLatest);

  const pinToLatestViewport = useCallback(
    (behavior: ScrollBehavior) => {
      flushScrollThreadToLatest(
        messagesScrollRef.current,
        messagesEndRef.current,
        behavior,
      );
      if (scrollComposerIntoView) {
        flushScrollMessagesTabChromeIntoView(behavior, {
          composerId: THREAD_PANEL_COMPOSER_ID,
          tabsSectionId: WORKSPACE_TABS_SECTION_ID,
        });
      }
    },
    [messagesEndRef, messagesScrollRef, scrollComposerIntoView],
  );

  useLayoutEffect(() => {
    if (!pinToLatest) {
      prevPinRef.current = false;
      return;
    }

    const previousCount = prevMessageCountRef.current;
    const pinJustEnabled = pinToLatest && !prevPinRef.current;
    const countIncreased = previousCount !== null && messageCount > previousCount;
    const firstPin = previousCount === null;

    if (firstPin || countIncreased || pinJustEnabled) {
      const behavior = firstPin || pinJustEnabled ? "auto" : "smooth";
      pinToLatestViewport(behavior);
    }

    prevMessageCountRef.current = messageCount;
    prevPinRef.current = pinToLatest;
  }, [messageCount, pinToLatest, pinToLatestViewport]);
}
