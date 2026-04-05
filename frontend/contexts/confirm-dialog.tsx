"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { DialogCloseButton } from "@/components/dialog-close-button";

export type ConfirmVariant = "default" | "danger";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type DialogState = { open: false; options: null } | { open: true; options: ConfirmOptions };

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const defaultLabels = { confirm: "Confirm", cancel: "Cancel" };

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>({ open: false, options: null });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, options });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    const r = resolveRef.current;
    resolveRef.current = null;
    setState({ open: false, options: null });
    r?.(value);
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [state.open, close]);

  const opts = state.open ? state.options : null;
  const variant = opts?.variant ?? "default";
  const confirmLabel = opts?.confirmLabel ?? defaultLabels.confirm;
  const cancelLabel = opts?.cancelLabel ?? defaultLabels.cancel;

  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && opts ? (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] transition-opacity dark:bg-black/60"
            aria-label="Close dialog"
            onClick={() => close(false)}
          />
          <div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={opts.description ? descId : undefined}
            tabIndex={-1}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <h2
                id={titleId}
                className="min-w-0 flex-1 pr-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {opts.title}
              </h2>
              <DialogCloseButton onClick={() => close(false)} />
            </div>
            <div className="px-6 pb-6 pt-4">
            {opts.description ? (
              <p id={descId} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {opts.description}
              </p>
            ) : null}
            <div className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${opts.description ? "mt-6" : "mt-2"}`}>
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${confirmBtnClass}`}
              >
                {confirmLabel}
              </button>
            </div>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return ctx;
}
