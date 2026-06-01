"use client";

import { ConfirmDialogProvider } from "@/contexts/confirm-dialog";
import { ThemeProvider } from "@/contexts/theme/ThemeProvider";
import { ToastProvider } from "@/contexts/toast";
import { QueryProvider } from "@/hooks/query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ConfirmDialogProvider>
          <ToastProvider>{children}</ToastProvider>
        </ConfirmDialogProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
