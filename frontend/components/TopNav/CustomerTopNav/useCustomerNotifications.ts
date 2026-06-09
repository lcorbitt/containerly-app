"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMyAlerts } from "@/hooks/queries/useAlerts";
import { useAcknowledgeAllMyAlertsMutation } from "@/hooks/mutations/useAlerts";
import { useMarkImporterShipmentThreadReadMutation } from "@/hooks/mutations/useShipmentMessageThreads";
import { isMessageShipmentAlert } from "@/utils/alert-inbox";

/** Drives the customer top-nav notification bell. `userId` comes from the shared session in
 *  `useCustomerTopNav` so we don't spin up a second auth client / subscription in the shell. */
export function useCustomerNotifications(userId: string | null) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ackedOnOpenRef = useRef(false);

  const alerts = useMyAlerts(userId);
  const acknowledgeAllMut = useAcknowledgeAllMyAlertsMutation(userId);
  const markThreadReadMut = useMarkImporterShipmentThreadReadMutation();

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

    const messageShipmentIds = [
      ...new Set(
        alerts
          .filter((a) => !a.acknowledged_at && isMessageShipmentAlert(a) && a.shipment_id)
          .map((a) => a.shipment_id as string),
      ),
    ];

    for (const shipmentId of messageShipmentIds) {
      markThreadReadMut.mutate({ shipmentId });
    }
    acknowledgeAllMut.mutate();
  }, [open, unackedCount, userId, alerts]);

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
