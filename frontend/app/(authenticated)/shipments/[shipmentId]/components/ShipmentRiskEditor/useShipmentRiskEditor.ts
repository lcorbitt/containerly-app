"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/contexts/toast";
import { useUpdateShipmentRiskMutation } from "@/hooks/mutations/useShipmentRisk";
import { shipmentRiskSelectValue } from "./utils";
import type { ShipmentRiskEditorProps, ShipmentRiskSelectValue } from "./types";

export function useShipmentRiskEditor({
  shipmentId,
  organizationId,
  riskLevel,
  riskMessage,
  primaryCarrierStatus,
  onSaved,
}: ShipmentRiskEditorProps) {
  const { toast } = useToast();
  const mutation = useUpdateShipmentRiskMutation();

  const serverRiskSelect = shipmentRiskSelectValue(riskLevel, primaryCarrierStatus);
  const savedMessage = riskMessage?.trim() ?? "";

  const [pendingRiskSelect, setPendingRiskSelect] = useState<ShipmentRiskSelectValue | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const riskSelect = pendingRiskSelect ?? serverRiskSelect;
  const displayRisk = riskSelect;

  const persistRisk = useCallback(
    async (level: ShipmentRiskSelectValue, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) {
        toast("Risk message is required when changing risk status", "error");
        return false;
      }

      const result = await mutation.mutateAsync({
        organization_id: organizationId,
        shipment_id: shipmentId,
        risk_level: level,
        risk_message: trimmed,
      });

      if (!result.ok) {
        toast(result.error, "error");
        return false;
      }

      toast("Shipment risk updated", "success");
      setPendingRiskSelect(null);
      onSaved();
      return true;
    },
    [mutation, onSaved, organizationId, shipmentId, toast],
  );

  const closeMessageModal = useCallback(() => {
    if (mutation.isPending) return;
    setMessageModalOpen(false);
    setModalMessage("");
    setPendingRiskSelect(null);
  }, [mutation.isPending]);

  const handleRiskSelectChange = useCallback(
    (next: ShipmentRiskSelectValue) => {
      if (next === serverRiskSelect) {
        setPendingRiskSelect(null);
        return;
      }

      setPendingRiskSelect(next);
      setModalMessage(savedMessage);
      setMessageModalOpen(true);
    },
    [savedMessage, serverRiskSelect],
  );

  const saveMessageFromModal = useCallback(async () => {
    const ok = await persistRisk(riskSelect, modalMessage);
    if (ok) {
      setMessageModalOpen(false);
      setModalMessage("");
    }
  }, [modalMessage, persistRisk, riskSelect]);

  const destinationRisk = pendingRiskSelect ?? serverRiskSelect;

  return {
    riskSelect,
    displayRisk,
    currentRisk: serverRiskSelect,
    destinationRisk,
    handleRiskSelectChange,
    messageModalOpen,
    closeMessageModal,
    modalMessage,
    setModalMessage,
    saveMessageFromModal,
    saving: mutation.isPending,
  };
}
