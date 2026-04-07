"use client";

import { useCallback, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

import { DEFAULT_MAX_HEIGHT_PX } from "./constants";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> & {
  /** Cap height (~Discord: scroll inside after this many pixels). */
  maxHeightPx?: number;
};

/**
 * Single-line–height by default, non-resizable; grows with wrapped lines up to maxHeightPx.
 */
export function AutoGrowTextarea({
  maxHeightPx = DEFAULT_MAX_HEIGHT_PX,
  className = "",
  value,
  onChange,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, maxHeightPx);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeightPx ? "auto" : "hidden";
  }, [maxHeightPx]);

  useLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={onChange}
      className={`resize-none ${className}`.trim()}
      {...rest}
    />
  );
}
