"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

const SHOW_DELAY_MS = 500;
const FADE_MS = 180;

/** Above confirm dialog (z-[250]), corner action bars, modals. */
const TOOLTIP_Z = 99999;
const GAP_PX = 8;

type Props = {
  label: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
};

export function ActionHoverTooltip({ label, children }: Props) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  const [fixedPos, setFixedPos] = useState<{ left: number; top: number } | null>(null);
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
    setFixedPos(null);
    setShown(false);
  }, [cancelShow]);

  const scheduleShow = useCallback(() => {
    cancelShow();
    showTimerRef.current = setTimeout(() => setShown(true), SHOW_DELAY_MS);
  }, [cancelShow]);

  useEffect(() => () => cancelShow(), [cancelShow]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setFixedPos({ left: r.left + r.width / 2, top: r.top - GAP_PX });
  }, []);

  useLayoutEffect(() => {
    if (!shown) {
      setFixedPos(null);
      return;
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [shown, updatePosition]);

  useEffect(() => {
    if (!fixedPos) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [fixedPos]);

  const child = isValidElement(children)
    ? cloneElement(children, {
        "aria-describedby": shown ? tooltipId : undefined,
      })
    : children;

  const portal =
    shown &&
    fixedPos &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        id={tooltipId}
        role="tooltip"
        style={{
          position: "fixed",
          left: fixedPos.left,
          top: fixedPos.top,
          zIndex: TOOLTIP_Z,
          transform: "translate(-50%, -100%)",
        }}
        className="pointer-events-none flex flex-col items-center"
      >
        <div
          style={{ transitionDuration: `${FADE_MS}ms` }}
          className={`flex flex-col items-center transition-[opacity,transform] ease-out ${
            entered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          <div className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-700">
            {label}
          </div>
          <div
            aria-hidden
            className="-mt-px h-0 w-0 shrink-0 border-x-[7px] border-x-transparent border-t-[8px] border-t-zinc-900 dark:border-t-zinc-700"
          />
        </div>
      </div>,
      document.body,
    );

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex shrink-0"
      onPointerEnter={scheduleShow}
      onPointerLeave={hide}
      onFocus={scheduleShow}
      onBlur={hide}
    >
      {child}
      {portal}
    </span>
  );
}
