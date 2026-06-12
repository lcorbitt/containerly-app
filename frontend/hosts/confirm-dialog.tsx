"use client";

import { useAtom, useSetAtom } from "jotai";
import { useEffect, useId } from "react";
import { confirmDialogAtom, resolveConfirmAtom } from "@/atoms/confirm-dialog";
import { Modal } from "@/components/Modal";
import { REVEAL_DURATION_MS } from "@/components/Reveal/constants";

const defaultLabels = { confirm: "Confirm", cancel: "Cancel" };

const CONFIRM_DIALOG_OVERLAY_CLASS = "fixed inset-0 z-[250]";

export function ConfirmDialogHost({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useAtom(confirmDialogAtom);
  const resolve = useSetAtom(resolveConfirmAtom);
  const descId = useId();

  const close = (value: boolean) => {
    if (!dialog.requestId) return;
    resolve({ requestId: dialog.requestId, value });
  };

  useEffect(() => {
    if (dialog.open || !dialog.options) return;
    const timer = window.setTimeout(
      () => setDialog({ open: false, options: null, requestId: null }),
      REVEAL_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [dialog.open, dialog.options, setDialog]);

  const options = dialog.options;
  const variant = options?.variant ?? "default";
  const confirmLabel = options?.confirmLabel ?? defaultLabels.confirm;
  const cancelLabel = options?.cancelLabel ?? defaultLabels.cancel;

  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

  return (
    <>
      {children}
      {options ? (
        <Modal
          open={dialog.open}
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
    </>
  );
}
