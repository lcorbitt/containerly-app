"use client";

import { atom, useSetAtom } from "jotai";
import { useCallback } from "react";

export type ConfirmVariant = "default" | "danger";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export interface ConfirmDialogState {
  open: boolean;
  options: ConfirmOptions | null;
  requestId: string | null;
}

const confirmResolvers = new Map<string, (value: boolean) => void>();

function createRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `confirm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const confirmDialogAtom = atom<ConfirmDialogState>({
  open: false,
  options: null,
  requestId: null,
});

export const resolveConfirmAtom = atom(
  null,
  (get, set, { requestId, value }: { requestId: string; value: boolean }) => {
    const resolver = confirmResolvers.get(requestId);
    confirmResolvers.delete(requestId);
    resolver?.(value);
    const current = get(confirmDialogAtom);
    set(confirmDialogAtom, {
      open: false,
      options: current.options,
      requestId: null,
    });
  },
);

export function useConfirm() {
  const setDialog = useSetAtom(confirmDialogAtom);

  const confirm = useCallback(
    (options: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        const requestId = createRequestId();
        confirmResolvers.set(requestId, resolve);
        setDialog({ open: true, options, requestId });
      });
    },
    [setDialog],
  );

  return { confirm };
}
