"use client";

import { useCallback, useState } from "react";

export function useShipmentSidebarSettingsRow() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  return { open, close, toggle } as const;
}
