"use client";

import { cloneElement, isValidElement, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { FADE_MS, TOOLTIP_Z } from "./constants";
import { useHoverTooltip } from "./hooks/useHoverTooltip";

type Props = {
  label: string;
  /** Optional classes for multi-line/wide tooltip copy. */
  labelClassName?: string;
  /** Optional classes on the hover wrapper (e.g. flex-1 for equal-width tab slots). */
  wrapperClassName?: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
};

export function ActionHoverTooltip({ label, labelClassName, wrapperClassName, children }: Props) {
  const { visible, coords, entered, triggerRef, show, hide, onFocus, onBlur, tooltipId } =
    useHoverTooltip();

  const child = isValidElement(children)
    ? cloneElement(children, {
        "aria-describedby": visible ? tooltipId : undefined,
      })
    : children;

  const portal =
    visible &&
    coords &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        id={tooltipId}
        role="tooltip"
        style={{
          position: "fixed",
          left: coords.left,
          top: coords.top,
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
          <div
            className={`rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-700${labelClassName ? ` ${labelClassName}` : ""}`}
          >
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
      className={`relative inline-flex shrink-0${wrapperClassName ? ` ${wrapperClassName}` : ""}`}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {child}
      {portal}
    </span>
  );
}
