"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Accessible checkbox with a card-style row and custom visual control (native input is visually hidden).
 */
export function CheckboxTile({
  id,
  checked,
  onCheckedChange,
  disabled,
  children,
}: {
  id?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={[
        "group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-[border-color,background-color,box-shadow]",
        checked
          ? "border-emerald-500/50 bg-gradient-to-r from-emerald-50/95 to-sky-50/40 shadow-[0_1px_2px_rgba(16,185,129,0.12)] dark:border-emerald-500/35 dark:from-emerald-950/45 dark:to-sky-950/25 dark:shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          : "border-zinc-200/90 bg-white hover:border-zinc-300 hover:bg-zinc-50/90 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/40",
        disabled ? "pointer-events-none cursor-not-allowed opacity-45" : "",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500/45 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white dark:has-[:focus-visible]:ring-offset-zinc-950",
      ].join(" ")}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
      <span
        className={[
          "flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[5px] border-2 transition-[border-color,background-color,transform]",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-zinc-950",
          checked
            ? "scale-100 border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-500 dark:bg-emerald-500"
            : "border-zinc-300 bg-white group-hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:group-hover:border-zinc-500",
        ].join(" ")}
        aria-hidden
      >
        <Check
          strokeWidth={3}
          className={`h-2.5 w-2.5 transition-opacity duration-150 ${checked ? "opacity-100" : "opacity-0"}`}
        />
      </span>
      <span className="min-w-0 flex-1 text-sm leading-snug text-zinc-800 dark:text-zinc-100">{children}</span>
    </label>
  );
}
