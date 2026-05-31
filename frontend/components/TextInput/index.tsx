"use client";

import { X } from "lucide-react";
import { forwardRef, useCallback } from "react";
import {
  TEXT_INPUT_BASE_CLASS,
  TEXT_INPUT_CLEAR_BTN_CLASS,
  TEXT_INPUT_CLEARABLE_PADDING_CLASS,
  TEXT_INPUT_CONTAINER_CLASS,
} from "./constants";
import type { TextInputProps } from "./types";

export type { TextInputProps } from "./types";

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    type = "text",
    value,
    defaultValue,
    disabled,
    clearable = true,
    containerClassName,
    className,
    onChange,
    onClear,
    ...rest
  },
  ref,
) {
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : (defaultValue ?? "");
  const hasValue = String(resolvedValue).length > 0;
  const showClear = clearable && hasValue && !disabled;

  const handleClear = useCallback(() => {
    onClear?.();
    onChange?.({
      target: { value: "" },
      currentTarget: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  }, [onChange, onClear]);

  const inputClassName = [TEXT_INPUT_BASE_CLASS, className ?? "", showClear ? TEXT_INPUT_CLEARABLE_PADDING_CLASS : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[TEXT_INPUT_CONTAINER_CLASS, containerClassName ?? ""].filter(Boolean).join(" ")}>
      <input
        ref={ref}
        type={type}
        {...(isControlled ? { value } : defaultValue !== undefined ? { defaultValue } : {})}
        disabled={disabled}
        onChange={onChange}
        className={inputClassName || undefined}
        {...rest}
      />
      {showClear ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Clear input"
          onClick={handleClear}
          className={TEXT_INPUT_CLEAR_BTN_CLASS}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
});
