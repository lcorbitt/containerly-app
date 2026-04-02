"use client";

import { ConfirmDialogProvider } from "@/contexts/confirm-dialog";
import { ToastProvider } from "@/contexts/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmDialogProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfirmDialogProvider>
  );
}
