"use client";

import { createContext, useContext } from "react";
import type { NewShipmentModalContextValue } from "./types";

export const NewShipmentModalContext = createContext<NewShipmentModalContextValue | null>(null);

export function useNewShipmentModal(): NewShipmentModalContextValue {
  const ctx = useContext(NewShipmentModalContext);
  if (!ctx) {
    throw new Error("useNewShipmentModal must be used within NewShipmentModalProvider");
  }
  return ctx;
}
