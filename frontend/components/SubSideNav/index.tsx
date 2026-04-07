"use client";

import { ChevronLeft } from "lucide-react";

type SubSideNavProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

/**
 * Secondary column that sits beside the main app side nav — expand/collapse shell only.
 * Width animates open/closed; inner column keeps a fixed width so content does not reflow during the transition.
 */
export function SubSideNav({ title, open, onOpenChange, children }: SubSideNavProps) {
  return (
    <div
      className={`flex h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none ${
        open ? "w-[min(100vw-5rem,17.5rem)]" : "w-0"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`flex h-full min-h-0 w-[min(100vw-5rem,17.5rem)] shrink-0 flex-col border-l border-zinc-200 bg-zinc-50/90 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-950/90 ${
          open
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-2 opacity-0 motion-reduce:translate-x-0"
        }`}
        role="complementary"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={!open}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-200/80 disabled:pointer-events-none dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Close panel"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
