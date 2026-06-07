"use client";

import { ConfirmDialogProvider } from "@/contexts/confirm-dialog";
import { ToastProvider } from "@/contexts/toast";
import { ThemeSync } from "@/components/ThemeSync";
import { NavigationProgressProvider } from "@/components/NavigationProgress";
import { QueryProvider } from "@/hooks/query-provider";
import { FeedbackWidgetHost } from "@/components/FeedbackWidget/FeedbackWidgetHost";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeSync />
      <NavigationProgressProvider>
        <ConfirmDialogProvider>
          <ToastProvider>
            <FeedbackWidgetHost>{children}</FeedbackWidgetHost>
          </ToastProvider>
        </ConfirmDialogProvider>
      </NavigationProgressProvider>
    </QueryProvider>
  );
}
