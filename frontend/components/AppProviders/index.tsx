"use client";

import { useState } from "react";
import { Provider as JotaiProvider, createStore } from "jotai";
import { ThemeSync } from "@/components/ThemeSync";
import { NavigationProgressHost } from "@/hosts/navigation-progress";
import { ConfirmDialogHost } from "@/hosts/confirm-dialog";
import { ToastHost } from "@/hosts/toast";
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
        <NavigationProgressHost>
          <ConfirmDialogHost>
            <ToastHost>{children}</ToastHost>
          </ConfirmDialogHost>
        </NavigationProgressHost>
      </QueryProvider>
    </JotaiProvider>
  );
}
