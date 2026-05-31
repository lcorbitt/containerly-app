"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { updateShipmentNotificationSubscription } from "@/services/shipment.service";

export function useShipmentNotificationsPanel({
  shipmentId,
  initialSubscribed,
}: {
  shipmentId: string;
  initialSubscribed: boolean;
}) {
  const { toast } = useToast();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubscribed(initialSubscribed);
  }, [initialSubscribed, shipmentId]);

  const toggle = useCallback(async () => {
    if (!selectedOrgId) return;
    const next = !subscribed;
    setSaving(true);
    setSubscribed(next);
    try {
      const saved = await updateShipmentNotificationSubscription({
        shipmentId,
        organizationId: selectedOrgId,
        subscribed: next,
      });
      setSubscribed(saved);
      toast(saved ? "Subscribed to email updates" : "Unsubscribed from email updates", "success");
    } catch (e) {
      setSubscribed(subscribed);
      toast(e instanceof Error ? e.message : "Could not update subscription", "error");
    } finally {
      setSaving(false);
    }
  }, [selectedOrgId, shipmentId, subscribed, toast]);

  return { subscribed, saving, toggle };
}

export type ShipmentNotificationsPanelState = ReturnType<typeof useShipmentNotificationsPanel>;
