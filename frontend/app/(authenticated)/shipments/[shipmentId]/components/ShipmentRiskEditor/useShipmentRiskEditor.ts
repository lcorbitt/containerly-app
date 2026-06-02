"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/contexts/toast";
import { useUpdateShipmentRiskMutation } from "@/hooks/mutations/useShipmentRisk";
import type { ShipmentRiskLevel } from "@shared/dto/logistics.dto";
import { displayRiskFromSelect, shipmentRiskSelectValue } from "./utils";
import type { ShipmentRiskEditorProps, ShipmentRiskSelectValue } from "./types";

function riskLevelFromSelect(riskSelect: ShipmentRiskSelectValue): ShipmentRiskLevel | null {
  return riskSelect === "low" || riskSelect === "medium" || riskSelect === "high" ? riskSelect : null;
}

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

  const serverRiskSelect = shipmentRiskSelectValue(riskLevel);
  const savedMessage = riskMessage?.trim() ?? "";

  const [pendingRiskSelect, setPendingRiskSelect] = useState<ShipmentRiskSelectValue | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const riskSelect = pendingRiskSelect ?? serverRiskSelect;
  const displayRisk = displayRiskFromSelect(riskSelect, primaryCarrierStatus);

  const persistRisk = useCallback(
    async (level: ShipmentRiskSelectValue, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) {
        toast("Risk message is required", "error");
        return false;
      }

      const result = await mutation.mutateAsync({
        organization_id: organizationId,
        shipment_id: shipmentId,
        risk_level: riskLevelFromSelect(level),
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

  const openMessageModal = useCallback(() => {
    setModalMessage(savedMessage);
    setMessageModalOpen(true);
  }, [savedMessage]);

  const closeMessageModal = useCallback(() => {
    if (mutation.isPending) return;
    setMessageModalOpen(false);
    setModalMessage(savedMessage);
    setPendingRiskSelect(null);
  }, [mutation.isPending, savedMessage]);

  const handleRiskSelectChange = useCallback(
    async (next: ShipmentRiskSelectValue) => {
      setPendingRiskSelect(next);
      if (!savedMessage) {
        openMessageModal();
        return;
      }

      const ok = await persistRisk(next, savedMessage);
      if (!ok) {
        setPendingRiskSelect(null);
      }
    },
    [openMessageModal, persistRisk, savedMessage],
  );

  const saveMessageFromModal = useCallback(async () => {
    const ok = await persistRisk(riskSelect, modalMessage);
    if (ok) {
      setMessageModalOpen(false);
    }
  }, [modalMessage, persistRisk, riskSelect]);

  const messageTriggerLabel = savedMessage ? savedMessage : "Add message";

  return {
    riskSelect,
    displayRisk,
    handleRiskSelectChange,
    messageModalOpen,
    openMessageModal,
    closeMessageModal,
    modalMessage,
    setModalMessage,
    saveMessageFromModal,
    messageTriggerLabel,
    hasSavedMessage: savedMessage.length > 0,
    saving: mutation.isPending,
  };
}
