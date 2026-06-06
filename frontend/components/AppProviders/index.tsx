"use client";

import { ConfirmDialogProvider } from "@/contexts/confirm-dialog";
import { ToastProvider } from "@/contexts/toast";
import { ThemeSync } from "@/components/ThemeSync";
import { NavigationProgressProvider } from "@/components/NavigationProgress";
import { QueryProvider } from "@/hooks/query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeSync />
      <NavigationProgressProvider>
        <ConfirmDialogProvider>
          <ToastProvider>{children}</ToastProvider>
        </ConfirmDialogProvider>
      </NavigationProgressProvider>
    </QueryProvider>
  );
}
