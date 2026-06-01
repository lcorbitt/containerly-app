"use client";

import { ConfirmDialogProvider } from "@/contexts/confirm-dialog";
import { ThemeProvider } from "@/contexts/theme/ThemeProvider";
import { ToastProvider } from "@/contexts/toast";
import { NavigationProgressProvider } from "@/components/NavigationProgress";
import { QueryProvider } from "@/hooks/query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <NavigationProgressProvider>
          <ConfirmDialogProvider>
            <ToastProvider>{children}</ToastProvider>
          </ConfirmDialogProvider>
        </NavigationProgressProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
