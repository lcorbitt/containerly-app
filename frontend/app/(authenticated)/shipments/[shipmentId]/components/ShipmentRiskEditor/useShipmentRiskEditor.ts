"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/contexts/toast";
import { useUpdateShipmentRiskMutation } from "@/hooks/mutations/useShipments";
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

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalRiskSelect, setModalRiskSelect] = useState<ShipmentRiskSelectValue>(serverRiskSelect);

  const displayRisk = serverRiskSelect;

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
      onSaved();
      return true;
    },
    [mutation, onSaved, organizationId, shipmentId, toast],
  );

  const closeMessageModal = useCallback(() => {
    if (mutation.isPending) return;
    setMessageModalOpen(false);
    setModalMessage("");
  }, [mutation.isPending]);

  const openChangeModal = useCallback(() => {
    setModalRiskSelect(serverRiskSelect);
    setModalMessage(savedMessage);
    setMessageModalOpen(true);
  }, [savedMessage, serverRiskSelect]);

  const handleModalRiskChange = useCallback((next: ShipmentRiskSelectValue) => {
    setModalRiskSelect(next);
  }, []);

  const saveMessageFromModal = useCallback(async () => {
    const ok = await persistRisk(modalRiskSelect, modalMessage);
    if (ok) {
      setMessageModalOpen(false);
      setModalMessage("");
    }
  }, [modalMessage, modalRiskSelect, persistRisk]);

  return {
    displayRisk,
    currentRisk: serverRiskSelect,
    destinationRisk: modalRiskSelect,
    openChangeModal,
    handleModalRiskChange,
    messageModalOpen,
    closeMessageModal,
    modalMessage,
    setModalMessage,
    saveMessageFromModal,
    saving: mutation.isPending,
  };
}
