"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";

interface UseModalBehaviorOptions {
  open: boolean;
  onClose: () => void;
  /** When true, Escape is ignored (modal locked during async work). */
  busy?: boolean;
  /** When true, Escape does not close the modal. */
  disableEscapeClose?: boolean;
}

interface UseModalBehaviorResult {
  /** True once mounted on the client; portals must wait for this to avoid SSR mismatch. */
  portalReady: boolean;
  /** Stable id wired to the title element / `aria-labelledby`. */
  titleId: string;
  /** Stable id available for `aria-describedby`. */
  descId: string;
  /** Attach to the panel element so it receives focus on open. */
  panelRef: RefObject<HTMLDivElement | null>;
}

/**
 * Shared modal lifecycle: SSR-safe portal readiness, body scroll lock, focus management,
 * and Escape-to-close. Keeps every modal's behavior identical so changes apply everywhere.
 */
export function useModalBehavior({
  open,
  onClose,
  busy = false,
  disableEscapeClose = false,
}: UseModalBehaviorOptions): UseModalBehaviorResult {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy && !disableEscapeClose) {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, disableEscapeClose, onClose]);

  return { portalReady, titleId, descId, panelRef };
}
