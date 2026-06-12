"use client";

import { atom, useSetAtom } from "jotai";
import { useCallback } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

const DEFAULT_MS = 3000;

const autoHideTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const toastsAtom = atom<ToastItem[]>([]);

function createToastId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const removeToastAtom = atom(null, (_get, set, id: string) => {
  const timer = autoHideTimers.get(id);
  if (timer) clearTimeout(timer);
  autoHideTimers.delete(id);
  set(toastsAtom, (prev) => prev.filter((x) => x.id !== id));
});

export const dismissToastAtom = atom(null, (get, set, id: string) => {
  const timer = autoHideTimers.get(id);
  if (timer) clearTimeout(timer);
  autoHideTimers.delete(id);

  const item = get(toastsAtom).find((x) => x.id === id);
  if (!item || item.exiting) return;

  set(toastsAtom, (prev) => prev.map((x) => (x.id === id ? { ...x, exiting: true } : x)));
});

export const pushToastAtom = atom(
  null,
  (_get, set, payload: { message: string; variant: ToastVariant; durationMs: number }) => {
    const id = createToastId();
    set(toastsAtom, (prev) => [
      ...prev,
      { id, message: payload.message, variant: payload.variant, exiting: false },
    ]);
    const timer = setTimeout(() => set(dismissToastAtom, id), payload.durationMs);
    autoHideTimers.set(id, timer);
  },
);

export function useToast() {
  const push = useSetAtom(pushToastAtom);
  const dismiss = useSetAtom(dismissToastAtom);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = DEFAULT_MS) => {
      push({ message, variant, durationMs });
    },
    [push],
  );

  return { toast, dismiss };
}
