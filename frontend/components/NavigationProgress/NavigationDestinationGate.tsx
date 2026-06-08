"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useNavigationContentGate } from "./useNavigationContentGate";

/**
 * Holds the global navigation overlay on RSC destination pages until the client has mounted,
 * so cross-layout navigations (e.g. portal hub → customer settings) keep the blurred loader visible.
 */
export function NavigationDestinationGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const { overlayActive } = useNavigationContentGate(ready);

  if (!ready && overlayActive) return null;
  return children;
}
