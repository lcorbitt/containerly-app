"use client";

import { Settings2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Reveal } from "@/components/Reveal";
import {
  SIDEBAR_SETTINGS_BODY_CLASS,
  SIDEBAR_SETTINGS_COG_BTN_CLASS,
  SIDEBAR_SETTINGS_HEADER_CLASS,
  SIDEBAR_SETTINGS_LABEL_CLASS,
  SIDEBAR_SETTINGS_POPOVER_CLASS,
  SIDEBAR_SETTINGS_POPOVER_REVEAL_CLASS,
} from "./constants";
import type { ShipmentSidebarSettingsRowProps } from "./types";
import { useShipmentSidebarSettingsRow } from "./useShipmentSidebarSettingsRow";

export function ShipmentSidebarSettingsRow({
  label,
  summary,
  children,
}: ShipmentSidebarSettingsRowProps) {
  const { open, close, toggle } = useShipmentSidebarSettingsRow();
  const popoverRef = useRef<HTMLDivElement>(null);
  const cogRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (cogRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        popoverRef.current?.querySelector<HTMLElement>("[data-sidebar-popover-focus]")?.focus();
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [open]);

  const panelContent = typeof children === "function" ? children({ close }) : children;

  return (
    <div className="relative py-3 first:pt-0 last:pb-0">
      <div className={SIDEBAR_SETTINGS_HEADER_CLASS}>
        <h3 className={SIDEBAR_SETTINGS_LABEL_CLASS}>{label}</h3>
        <button
          ref={cogRef}
          type="button"
          aria-label={open ? `Close ${label} menu` : `Edit ${label}`}
          aria-expanded={open}
          aria-controls={popoverId}
          onClick={toggle}
          className={SIDEBAR_SETTINGS_COG_BTN_CLASS}
        >
          <Settings2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className={SIDEBAR_SETTINGS_BODY_CLASS}>{summary}</div>

      <Reveal show={open} className={SIDEBAR_SETTINGS_POPOVER_REVEAL_CLASS}>
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={`${label} settings`}
          className={SIDEBAR_SETTINGS_POPOVER_CLASS}
        >
          {panelContent}
        </div>
      </Reveal>
    </div>
  );
}
