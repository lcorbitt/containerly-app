"use client";

import { BarChart3 } from "lucide-react";
import {
  SHIPMENT_DETAILS_ASSESSMENT_ROW_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_CONTENT_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_ICON_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_TRAILING_CLASS,
} from "@/components/ShipmentDetailsSubCard";
import { riskInsightBadgeClass } from "@/utils/report-insights";
import { ShipmentRiskMessageModal } from "./ShipmentRiskMessageModal";
import {
  SHIPMENT_RISK_EDITOR_CHANGE_BUTTON_CLASS,
  SHIPMENT_RISK_EDITOR_GRID_CONTROLS_CLASS,
  SHIPMENT_RISK_EDITOR_INLINE_CLASS,
  SHIPMENT_RISK_EDITOR_LABEL_CLASS,
  SHIPMENT_RISK_EDITOR_PILL_CLASS,
  SHIPMENT_RISK_EDITOR_ROW_CLASS,
  SHIPMENT_RISK_EDITOR_SECTION_CLASS,
} from "./constants";
import type { ShipmentRiskEditorProps } from "./types";
import { useShipmentRiskEditor } from "./useShipmentRiskEditor";

export function ShipmentRiskEditor({ variant = "default", ...props }: ShipmentRiskEditorProps) {
  const {
    displayRisk,
    currentRisk,
    destinationRisk,
    openChangeModal,
    handleModalRiskChange,
    messageModalOpen,
    closeMessageModal,
    modalMessage,
    setModalMessage,
    saveMessageFromModal,
    saving,
  } = useShipmentRiskEditor(props);

  const riskControls = (
    <div className={SHIPMENT_RISK_EDITOR_INLINE_CLASS}>
      <span
        className={`${SHIPMENT_RISK_EDITOR_PILL_CLASS} ${riskInsightBadgeClass(displayRisk)}`}
        aria-label={`${displayRisk} risk`}
      >
        {displayRisk.toUpperCase()}
      </span>
      <button
        type="button"
        disabled={saving}
        onClick={openChangeModal}
        className={SHIPMENT_RISK_EDITOR_CHANGE_BUTTON_CLASS}
      >
        Change
      </button>
    </div>
  );

  return (
    <>
      {variant === "grid-cell" ? (
        <div className={SHIPMENT_RISK_EDITOR_GRID_CONTROLS_CLASS}>{riskControls}</div>
      ) : variant === "inline" ? (
        <div className={SHIPMENT_DETAILS_ASSESSMENT_ROW_CLASS}>
          <span className={SHIPMENT_DETAILS_ASSESSMENT_ROW_ICON_CLASS} aria-hidden>
            <BarChart3 className="h-4 w-4" />
          </span>
          <div className={SHIPMENT_DETAILS_ASSESSMENT_ROW_CONTENT_CLASS}>
            <p className={SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS}>Risk Level</p>
          </div>
          <div className={`${SHIPMENT_DETAILS_ASSESSMENT_ROW_TRAILING_CLASS} flex flex-wrap items-center gap-2`}>
            {riskControls}
          </div>
        </div>
      ) : (
        <section className={SHIPMENT_RISK_EDITOR_SECTION_CLASS} aria-label="Shipment risk">
          <div className={SHIPMENT_RISK_EDITOR_ROW_CLASS}>
            <span className={SHIPMENT_RISK_EDITOR_LABEL_CLASS}>Risk</span>
            {riskControls}
          </div>
        </section>
      )}

      <ShipmentRiskMessageModal
        open={messageModalOpen}
        currentRisk={currentRisk}
        destinationRisk={destinationRisk}
        message={modalMessage}
        saving={saving}
        onDestinationRiskChange={handleModalRiskChange}
        onMessageChange={setModalMessage}
        onClose={closeMessageModal}
        onSave={() => void saveMessageFromModal()}
      />
    </>
  );
}
