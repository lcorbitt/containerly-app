"use client";

import type { ReactNode } from "react";
import {
  RADIO_DISABLED_CLASS,
  RADIO_FOCUS_RING_CLASS,
  RADIO_INDICATOR_BASE_CLASS,
  RADIO_INDICATOR_CHECKED_CLASS,
  RADIO_INDICATOR_DOT_CLASS,
  RADIO_INDICATOR_INLINE_SIZE_CLASS,
  RADIO_INDICATOR_PEER_FOCUS_CLASS,
  RADIO_INDICATOR_TILE_SIZE_CLASS,
  RADIO_INDICATOR_UNCHECKED_CLASS,
  RADIO_INLINE_LABEL_CLASS,
  RADIO_INLINE_TEXT_CLASS,
  RADIO_INPUT_CLASS,
  RADIO_TILE_DESCRIPTION_CLASS,
  RADIO_TILE_LABEL_BASE_CLASS,
  RADIO_TILE_LABEL_CHECKED_CLASS,
  RADIO_TILE_LABEL_UNCHECKED_CLASS,
  RADIO_TILE_TITLE_CLASS,
} from "./constants";
import type { RadioGroupProps, RadioProps, RadioTileProps } from "./types";

export type { RadioGroupProps, RadioProps, RadioTileProps } from "./types";

function RadioIndicator({
  checked,
  size,
  className,
}: {
  checked: boolean;
  size: "inline" | "tile";
  className?: string;
}) {
  const sizeClass = size === "tile" ? RADIO_INDICATOR_TILE_SIZE_CLASS : RADIO_INDICATOR_INLINE_SIZE_CLASS;

  return (
    <span
      className={[
        RADIO_INDICATOR_BASE_CLASS,
        sizeClass,
        RADIO_INDICATOR_PEER_FOCUS_CLASS,
        checked ? RADIO_INDICATOR_CHECKED_CLASS : RADIO_INDICATOR_UNCHECKED_CLASS,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <span
        className={`${RADIO_INDICATOR_DOT_CLASS} transition-[transform,opacity] duration-150 ${
          checked ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      />
    </span>
  );
}

export function RadioGroup({
  children,
  className,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Accessible inline radio with a custom circular control (native input is visually hidden).
 */
export function Radio({
  id,
  name,
  value,
  checked,
  onChange,
  disabled,
  label,
  children,
  className,
}: RadioProps) {
  const content: ReactNode = children ?? label;

  return (
    <label
      className={[
        RADIO_INLINE_LABEL_CLASS,
        RADIO_FOCUS_RING_CLASS,
        disabled ? RADIO_DISABLED_CLASS : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={RADIO_INPUT_CLASS}
      />
      <RadioIndicator checked={checked} size="inline" />
      {content ? <span className={RADIO_INLINE_TEXT_CLASS}>{content}</span> : null}
    </label>
  );
}

/**
 * Card-style radio row for richer option descriptions (native input is visually hidden).
 */
export function RadioTile({
  id,
  name,
  value,
  checked,
  onChange,
  disabled,
  title,
  description,
  className,
}: RadioTileProps) {
  return (
    <label
      className={[
        RADIO_TILE_LABEL_BASE_CLASS,
        RADIO_FOCUS_RING_CLASS,
        checked ? RADIO_TILE_LABEL_CHECKED_CLASS : RADIO_TILE_LABEL_UNCHECKED_CLASS,
        disabled ? RADIO_DISABLED_CLASS : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={RADIO_INPUT_CLASS}
      />
      <RadioIndicator checked={checked} size="tile" />
      <span className="min-w-0 flex-1">
        <span className={RADIO_TILE_TITLE_CLASS}>{title}</span>
        {description ? <span className={RADIO_TILE_DESCRIPTION_CLASS}>{description}</span> : null}
      </span>
    </label>
  );
}
