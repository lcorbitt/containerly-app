"use client";

import { useState } from "react";
import { Provider as JotaiProvider, createStore } from "jotai";
import { ConfirmDialogProvider } from "@/contexts/confirm-dialog";
import { ToastProvider } from "@/contexts/toast";
import { ThemeSync } from "@/components/ThemeSync";
import { NavigationProgressProvider } from "@/components/NavigationProgress";
import { QueryProvider } from "@/hooks/query-provider";
export function AppProviders({ children }: { children: React.ReactNode }) {
  // One explicit Jotai store per client (SSR-safe, no cross-request leakage). With a store in
  // context, hooks never fall back to getDefaultStore(), which avoids the "multiple Jotai
  // instances" default-store warning under dev HMR / dual bundling.
  const [jotaiStore] = useState(() => createStore());

  return (
    <JotaiProvider store={jotaiStore}>
      <QueryProvider>
        <ThemeSync />
        <NavigationProgressProvider>
          <ConfirmDialogProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ConfirmDialogProvider>
        </NavigationProgressProvider>
      </QueryProvider>
    </JotaiProvider>
  );
}
