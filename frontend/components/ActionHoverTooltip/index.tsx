"use client";

import { cloneElement, isValidElement } from "react";
import { createPortal } from "react-dom";
import { FADE_MS, TOOLTIP_Z } from "./constants";
import { useHoverTooltip } from "./hooks/useHoverTooltip";
import type { ActionHoverTooltipProps } from "./types";

export function ActionHoverTooltip({
  label,
  labelClassName,
  wrapperClassName,
  placement = "top",
  children,
}: ActionHoverTooltipProps) {
  const { visible, coords, entered, triggerRef, show, hide, onFocus, onBlur, tooltipId } =
    useHoverTooltip(placement);

  const isLeft = placement === "left";

  const child = isValidElement(children)
    ? cloneElement(children, {
        "aria-describedby": visible ? tooltipId : undefined,
      })
    : children;

  const bubble = (
    <div
      className={`rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-700${labelClassName ? ` ${labelClassName}` : ""}`}
    >
      {label}
    </div>
  );

  const arrow = (
    <div
      aria-hidden
      className={
        isLeft
          ? "-ml-px h-0 w-0 shrink-0 border-y-[7px] border-y-transparent border-l-8 border-l-zinc-900 dark:border-l-zinc-700"
          : "-mt-px h-0 w-0 shrink-0 border-x-[7px] border-x-transparent border-t-8 border-t-zinc-900 dark:border-t-zinc-700"
      }
    />
  );

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
          transform: isLeft ? "translate(-100%, -50%)" : "translate(-50%, -100%)",
        }}
        className={`pointer-events-none flex items-center ${isLeft ? "flex-row" : "flex-col"}`}
      >
        <div
          style={{ transitionDuration: `${FADE_MS}ms` }}
          className={`flex items-center transition-[opacity,transform] ease-out ${
            isLeft ? "flex-row" : "flex-col"
          } ${
            entered
              ? "translate-x-0 translate-y-0 opacity-100"
              : `opacity-0 ${isLeft ? "translate-x-1" : "translate-y-1"}`
          }`}
        >
          {bubble}
          {arrow}
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
