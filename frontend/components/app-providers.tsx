"use client";

import { ConfirmDialogProvider } from "@/contexts/confirm-dialog";
import { ToastProvider } from "@/contexts/toast";
import { QueryProvider } from "@/hooks/query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ConfirmDialogProvider>
        <ToastProvider>{children}</ToastProvider>
      </ConfirmDialogProvider>
    </QueryProvider>
  );
}
