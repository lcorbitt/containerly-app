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
import { Modal } from "@/components/Modal";
import { REVEAL_DURATION_MS } from "@/components/Reveal/constants";

export type ConfirmVariant = "default" | "danger";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const defaultLabels = { confirm: "Confirm", cancel: "Cancel" };

const CONFIRM_DIALOG_OVERLAY_CLASS = "fixed inset-0 z-[250]";

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const descId = useId();

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(nextOptions);
      setOpen(true);
    });
  }, []);

  const close = useCallback((value: boolean) => {
    const r = resolveRef.current;
    resolveRef.current = null;
    setOpen(false);
    r?.(value);
  }, []);

  useEffect(() => {
    if (open || !options) return;
    const timer = window.setTimeout(() => setOptions(null), REVEAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [open, options]);

  const variant = options?.variant ?? "default";
  const confirmLabel = options?.confirmLabel ?? defaultLabels.confirm;
  const cancelLabel = options?.cancelLabel ?? defaultLabels.cancel;

  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options ? (
        <Modal
          open={open}
          onClose={() => close(false)}
          role="alertdialog"
          size="md"
          title={options.title}
          overlayClassName={CONFIRM_DIALOG_OVERLAY_CLASS}
          describedById={options.description ? descId : undefined}
          footer={
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          }
        >
          {options.description ? (
            <p id={descId} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {options.description}
            </p>
          ) : null}
        </Modal>
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
