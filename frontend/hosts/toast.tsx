"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { dismissToastAtom, removeToastAtom, toastsAtom, type ToastVariant } from "@/atoms/toast";

function variantStyles(v: ToastVariant) {
  if (v === "success") {
    return "border-emerald-200/90 bg-emerald-50/95 text-emerald-950 dark:border-emerald-800/80 dark:bg-emerald-950/90 dark:text-emerald-50";
  }
  if (v === "error") {
    return "border-red-200/90 bg-red-50/95 text-red-950 dark:border-red-900/80 dark:bg-red-950/90 dark:text-red-50";
  }
  return "border-zinc-200/90 bg-white/95 text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:text-zinc-50";
}

export function ToastHost({ children }: { children: React.ReactNode }) {
  const toasts = useAtomValue(toastsAtom);
  const dismiss = useSetAtom(dismissToastAtom);
  const remove = useSetAtom(removeToastAtom);

  useEffect(() => {
    return () => {
      /* timers cleared per-toast in remove/dismiss atoms */
    };
  }, []);

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[200] flex w-[min(100vw-2rem,22rem)] flex-col gap-2 sm:w-80"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${variantStyles(t.variant)} ${t.exiting ? "toast-exit" : "toast-enter"}`}
            onAnimationEnd={(e) => {
              if (!t.exiting || e.animationName !== "toast-exit") return;
              remove(t.id);
            }}
          >
            <p className="min-w-0 flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <span aria-hidden className="block text-base leading-none">
                ×
              </span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
