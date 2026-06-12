"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { useToast } from "@/atoms/toast";
import { useUpdateShipmentNotificationSubscriptionMutation } from "@/hooks/mutations/useShipments";
import { invalidateShipmentAccessTabQuery } from "@/hooks/queries/useShipment";

export function useShipmentNotificationsPanel({
  shipmentId,
  initialSubscribed,
}: {
  shipmentId: string;
  initialSubscribed: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganizationWorkspace();
  const updateSubscriptionMutation = useUpdateShipmentNotificationSubscriptionMutation();
  const [subscribed, setSubscribed] = useState(initialSubscribed);

  useEffect(() => {
    setSubscribed(initialSubscribed);
  }, [initialSubscribed, shipmentId]);

  const toggle = useCallback(async () => {
    if (!selectedOrgId) return;
    const next = !subscribed;
    setSubscribed(next);
    try {
      const saved = await updateSubscriptionMutation.mutateAsync({
        shipmentId,
        organizationId: selectedOrgId,
        subscribed: next,
      });
      setSubscribed(saved);
      await invalidateShipmentAccessTabQuery(qc, { shipmentId, organizationId: selectedOrgId });
      toast(saved ? "Subscribed to email updates" : "Unsubscribed from email updates", "success");
    } catch (e) {
      setSubscribed(subscribed);
      toast(e instanceof Error ? e.message : "Could not update subscription", "error");
    }
  }, [qc, selectedOrgId, shipmentId, subscribed, toast, updateSubscriptionMutation]);

  return { subscribed, saving: updateSubscriptionMutation.isPending, toggle };
}

export type ShipmentNotificationsPanelState = ReturnType<typeof useShipmentNotificationsPanel>;
