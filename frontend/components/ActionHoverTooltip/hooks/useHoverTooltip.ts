"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { GAP_PX, SHOW_DELAY_MS } from "../constants";

export function useHoverTooltip() {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const [entered, setEntered] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelShow = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    cancelShow();
    setEntered(false);
    setCoords(null);
    setVisible(false);
  }, [cancelShow]);

  const show = useCallback(() => {
    cancelShow();
    showTimerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
  }, [cancelShow]);

  useEffect(() => () => cancelShow(), [cancelShow]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ left: r.left + r.width / 2, top: r.top - GAP_PX });
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!coords) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(id);
      setEntered(false);
    };
  }, [coords]);

  const onFocus = show;
  const onBlur = hide;

  return {
    visible,
    coords,
    entered,
    triggerRef,
    show,
    hide,
    onFocus,
    onBlur,
    tooltipId,
  };
}
