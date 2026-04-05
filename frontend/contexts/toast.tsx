"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
};

const DEFAULT_MS = 3000;

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function variantStyles(v: ToastVariant) {
  if (v === "success") {
    return "border-emerald-200/90 bg-emerald-50/95 text-emerald-950 dark:border-emerald-800/80 dark:bg-emerald-950/90 dark:text-emerald-50";
  }
  if (v === "error") {
    return "border-red-200/90 bg-red-50/95 text-red-950 dark:border-red-900/80 dark:bg-red-950/90 dark:text-red-50";
  }
  return "border-zinc-200/90 bg-white/95 text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:text-zinc-50";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const autoHideTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const t = autoHideTimers.current.get(id);
    if (t) clearTimeout(t);
    autoHideTimers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const dismiss = useCallback((id: string) => {
    const t = autoHideTimers.current.get(id);
    if (t) clearTimeout(t);
    autoHideTimers.current.delete(id);

    setToasts((prev) => {
      const item = prev.find((x) => x.id === id);
      if (!item || item.exiting) return prev;
      return prev.map((x) => (x.id === id ? { ...x, exiting: true } : x));
    });
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = DEFAULT_MS) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);
      const tid = setTimeout(() => dismiss(id), durationMs);
      autoHideTimers.current.set(id, tid);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = autoHideTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
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
              removeToast(t.id);
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
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
