"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

const triggerClass =
  "flex w-full items-center justify-between gap-2 rounded-md border-0 bg-transparent p-2 text-left text-sm text-zinc-900 transition-colors hover:bg-zinc-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-zinc-800/50 dark:focus-visible:ring-zinc-500/40 dark:focus-visible:ring-offset-zinc-950";

const listClassDefault =
  "absolute z-50 mt-2 max-h-60 w-full min-w-[12rem] overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950";

const optionClass = (active: boolean) =>
  `flex w-full p-2 text-left text-sm ${
    active
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900/80"
  }`;

export type CustomSelectOption = {
  value: string;
  label: string;
  /** Resolved public URL for `profiles.profile_image_path`, or null for placeholder initial. */
  avatarUrl?: string | null;
};

function SelectFieldTrigger({
  id,
  disabled,
  open,
  listId,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
  title,
  labelText,
  labelMuted,
  leading,
  onClick,
}: {
  id?: string;
  disabled: boolean;
  open: boolean;
  listId: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  title?: string;
  labelText: string;
  labelMuted?: boolean;
  leading?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      title={title}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? listId : undefined}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      onClick={onClick}
      className={triggerClass}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {leading}
        <span
          className={`min-w-0 truncate ${labelMuted ? "text-zinc-500 dark:text-zinc-400" : ""}`}
        >
          {labelText}
        </span>
      </span>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}

export function CustomSelect({
  id,
  "aria-labelledby": ariaLabelledBy,
  value,
  onValueChange,
  options,
  disabled = false,
  className = "",
  showAvatars = true,
  placeholderLabel,
}: {
  id?: string;
  "aria-labelledby"?: string;
  value: string;
  onValueChange: (next: string) => void;
  options: CustomSelectOption[];
  disabled?: boolean;
  className?: string;
  /** When false, options are label-only (e.g. shipments, enums). Default true for people pickers. */
  showAvatars?: boolean;
  /** Shown on the trigger when `value` does not match any option (e.g. empty = implicit default). */
  placeholderLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const displayLabel =
    selected?.label ?? (placeholderLabel != null && placeholderLabel !== "" ? placeholderLabel : undefined) ?? options[0]?.label ?? "—";
  const showAvatarInTrigger = showAvatars && Boolean(selected?.value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  const labelMuted = !selected && Boolean(placeholderLabel);

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()} onKeyDown={onKeyDown}>
      <SelectFieldTrigger
        id={id}
        disabled={disabled}
        open={open}
        listId={listId}
        aria-labelledby={ariaLabelledBy}
        labelText={displayLabel}
        labelMuted={labelMuted}
        leading={
          showAvatarInTrigger ? (
            <UserAvatar
              imageUrl={selected?.avatarUrl ?? null}
              label={displayLabel}
              size="md"
            />
          ) : undefined
        }
        onClick={() => !disabled && setOpen((o) => !o)}
      />
      {open ? (
        <ul id={listId} role="listbox" className={listClassDefault}>
          {options.map((o) => {
            const isSelected = value === o.value;
            const showOptAvatar = showAvatars && Boolean(o.value);
            return (
              <li key={o.value === "" ? "__empty" : o.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={optionClass(isSelected)}
                  onClick={() => {
                    onValueChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="flex items-center gap-2">
                    {showOptAvatar ? (
                      <UserAvatar imageUrl={o.avatarUrl ?? null} label={o.label} size="md" />
                    ) : null}
                    <span className="min-w-0 truncate">{o.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Same trigger + list styling as {@link CustomSelect}; choosing an item calls `onPick` (no persistent value). */
export function CustomMenuSelect({
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  placeholder,
  disabledPlaceholder,
  options,
  disabled = false,
  busy = false,
  onPick,
  className = "",
}: {
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  placeholder: string;
  disabledPlaceholder: string;
  options: CustomSelectOption[];
  disabled?: boolean;
  busy?: boolean;
  onPick: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const empty = options.length === 0;
  const isDisabled = disabled || empty || busy;
  const label = empty ? disabledPlaceholder : placeholder;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()} onKeyDown={(e) => {
      if (e.key === "Escape") setOpen(false);
    }}>
      <SelectFieldTrigger
        id={id}
        disabled={isDisabled}
        open={open}
        listId={listId}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        title={empty ? disabledPlaceholder : undefined}
        labelText={label}
        onClick={() => !isDisabled && setOpen((o) => !o)}
      />
      {open && !empty ? (
        <ul id={listId} role="listbox" className={listClassDefault}>
          {options.map((o) => (
            <li key={o.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={false}
                className={optionClass(false)}
                onClick={() => {
                  onPick(o.value);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <UserAvatar imageUrl={o.avatarUrl ?? null} label={o.label} size="md" />
                  <span className="min-w-0 truncate">{o.label}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
