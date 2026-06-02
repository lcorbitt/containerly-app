"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RICH_MESSAGE_FORMATTING_BUBBLE_REVEAL_DURATION_MS } from "./constants";

export interface FormattingBubbleCoords {
  left: number;
  top: number;
}

export function useRichMessageFormattingBubble(editor: Editor | null, disabled: boolean) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<FormattingBubbleCoords | null>(null);
  const [bubbleHover, setBubbleHover] = useState(false);
  const clearCoordsTimerRef = useRef(0);

  const scheduleCoordsClear = useCallback(() => {
    if (clearCoordsTimerRef.current) {
      window.clearTimeout(clearCoordsTimerRef.current);
    }
    clearCoordsTimerRef.current = window.setTimeout(() => {
      clearCoordsTimerRef.current = 0;
      setCoords(null);
    }, RICH_MESSAGE_FORMATTING_BUBBLE_REVEAL_DURATION_MS);
  }, []);

  const cancelCoordsClear = useCallback(() => {
    if (clearCoordsTimerRef.current) {
      window.clearTimeout(clearCoordsTimerRef.current);
      clearCoordsTimerRef.current = 0;
    }
  }, []);

  const hideBubble = useCallback(() => {
    setVisible(false);
    scheduleCoordsClear();
  }, [scheduleCoordsClear]);

  const updatePosition = useCallback(() => {
    if (!editor || disabled) {
      cancelCoordsClear();
      setVisible(false);
      setCoords(null);
      return;
    }

    const { from, to, empty } = editor.state.selection;
    if (empty) {
      if (!bubbleHover) {
        hideBubble();
      }
      return;
    }

    cancelCoordsClear();

    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    setCoords({
      left: (start.left + end.right) / 2,
      top: start.top - 8,
    });
    setVisible(true);
  }, [editor, disabled, bubbleHover, hideBubble, cancelCoordsClear]);

  useEffect(() => {
    if (!editor) return;

    const onSelectionUpdate = () => updatePosition();
    const onBlur = () => {
      window.setTimeout(() => {
        if (!bubbleHover) hideBubble();
      }, 120);
    };

    editor.on("selectionUpdate", onSelectionUpdate);
    editor.on("focus", onSelectionUpdate);
    editor.on("blur", onBlur);

    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
      editor.off("focus", onSelectionUpdate);
      editor.off("blur", onBlur);
    };
  }, [editor, updatePosition, bubbleHover, hideBubble]);

  const [, setRenderTick] = useState(0);
  useEffect(() => {
    if (!editor || !visible) return;
    const bump = () => setRenderTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor, visible]);

  useEffect(() => {
    if (!visible) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [visible, updatePosition]);

  useEffect(
    () => () => {
      if (clearCoordsTimerRef.current) {
        window.clearTimeout(clearCoordsTimerRef.current);
      }
    },
    [],
  );

  return {
    visible,
    coords,
    setBubbleHover,
    hide: hideBubble,
  };
}
