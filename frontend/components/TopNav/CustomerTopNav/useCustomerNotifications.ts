"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMyNotifications } from "@/hooks/queries/useAlerts";
import { useAcknowledgeAlertMutation } from "@/hooks/mutations/useAlerts";
import { filterBellNotifications } from "@/utils/alert-inbox";

/** Drives the customer top-nav notification bell. `userId` comes from the shared session in
 *  `useCustomerTopNav` so we don't spin up a second auth client / subscription in the shell. */
export function useCustomerNotifications(userId: string | null) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ackedOnOpenRef = useRef(false);

  const allAlerts = useMyNotifications(userId);
  const alerts = useMemo(() => filterBellNotifications(allAlerts), [allAlerts]);
  const acknowledgeMut = useAcknowledgeAlertMutation(null);

  const unackedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged_at).length,
    [alerts],
  );

  useEffect(() => {
    if (!open) {
      ackedOnOpenRef.current = false;
      return;
    }
    if (ackedOnOpenRef.current || unackedCount === 0 || !userId) return;
    ackedOnOpenRef.current = true;

    for (const alert of alerts.filter((a) => !a.acknowledged_at)) {
      acknowledgeMut.mutate(alert.id);
    }
  }, [open, unackedCount, userId, alerts, acknowledgeMut]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => setOpen(false), []);

  return {
    open,
    menuRef,
    alerts,
    unackedCount,
    toggle,
    close,
  };
}
