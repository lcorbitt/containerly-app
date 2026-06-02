"use client";

import { CustomSelect } from "@/components/CustomSelect";
import { riskInsightBadgeClass } from "@/utils/report-insights";
import { ShipmentRiskMessageModal } from "./ShipmentRiskMessageModal";
import {
  SHIPMENT_RISK_EDITOR_LABEL_CLASS,
  SHIPMENT_RISK_EDITOR_PILL_CLASS,
  SHIPMENT_RISK_EDITOR_ROW_CLASS,
  SHIPMENT_RISK_EDITOR_SECTION_CLASS,
  SHIPMENT_RISK_EDITOR_SELECT_SHELL_CLASS,
  SHIPMENT_RISK_SELECT_OPTIONS,
} from "./constants";
import type { ShipmentRiskEditorProps } from "./types";
import { shipmentRiskSelectFromValue } from "./utils";
import { useShipmentRiskEditor } from "./useShipmentRiskEditor";

export function ShipmentRiskEditor(props: ShipmentRiskEditorProps) {
  const {
    riskSelect,
    displayRisk,
    currentRisk,
    destinationRisk,
    handleRiskSelectChange,
    messageModalOpen,
    closeMessageModal,
    modalMessage,
    setModalMessage,
    saveMessageFromModal,
    saving,
  } = useShipmentRiskEditor(props);

  return (
    <>
      <section className={SHIPMENT_RISK_EDITOR_SECTION_CLASS} aria-label="Shipment risk">
        <div className={SHIPMENT_RISK_EDITOR_ROW_CLASS}>
          <span className={SHIPMENT_RISK_EDITOR_LABEL_CLASS}>Risk</span>
          <div className={SHIPMENT_RISK_EDITOR_SELECT_SHELL_CLASS}>
            <CustomSelect
              value={riskSelect}
              onValueChange={(value) => handleRiskSelectChange(shipmentRiskSelectFromValue(value))}
              options={SHIPMENT_RISK_SELECT_OPTIONS}
              showAvatars={false}
              disabled={saving}
              aria-label="Risk level"
              className="w-full"
            />
          </div>
          <span
            className={`${SHIPMENT_RISK_EDITOR_PILL_CLASS} ${riskInsightBadgeClass(displayRisk)}`}
            aria-label={`${displayRisk} risk`}
          >
            {displayRisk.toUpperCase()} risk
          </span>
        </div>
      </section>

      <ShipmentRiskMessageModal
        open={messageModalOpen}
        currentRisk={currentRisk}
        destinationRisk={destinationRisk}
        message={modalMessage}
        saving={saving}
        onMessageChange={setModalMessage}
        onClose={closeMessageModal}
        onSave={() => void saveMessageFromModal()}
      />
    </>
  );
}
