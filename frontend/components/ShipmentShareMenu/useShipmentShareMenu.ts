"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { SHIPMENT_SHARE_MENU_PANEL_WIDTH_PX } from "./constants";

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

export function useShipmentShareMenu() {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPosition | null>(null);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(SHIPMENT_SHARE_MENU_PANEL_WIDTH_PX, window.innerWidth - 16);
    setPanelPos({
      top: rect.bottom + 6,
      left: Math.max(8, rect.right - width),
      width,
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (prev) return false;
      updatePanelPosition();
      return true;
    });
  }, [updatePanelPosition]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    function onResize() {
      updatePanelPosition();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, close]);

  return {
    menuId,
    triggerRef,
    panelRef,
    open,
    panelPos,
    toggle,
    close,
  };
}
