"use client";

import { FileText, List, MessageSquare, Route } from "lucide-react";
import { useState } from "react";
import { ActionHoverTooltip } from "@/components/ActionHoverTooltip";
import { isShipmentPostApproval } from "@/utils/shipment-workflow-status";
import { workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { ShipmentTitleHeading } from "../ShipmentHeaderInfo/ShipmentTitleHeading";
import { ShipmentMessagesPanel } from "../ShipmentMessagesPanel";
import { ShipmentTrackingPanel } from "../ShipmentTrackingPanel";
import { ShipmentWorkspaceScopePanel } from "../ShipmentWorkspaceScopePanel";
import {
  SHIPMENT_DETAILS_TAB_DETAILS_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_DOCUMENTS_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_LIST_CLASS,
  SHIPMENT_DETAILS_TAB_MESSAGES_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_TITLE_CLASS,
  SHIPMENT_DETAILS_TAB_TRACKING_PANEL_CLASS,
  SHIPMENT_TRACKING_TAB_DISABLED_TOOLTIP,
  SHIPMENT_TRACKING_TAB_DISABLED_TOOLTIP_CLASS,
  SHIPMENT_TRACKING_TAB_SLOT_CLASS,
} from "./constants";
import type { ShipmentDetailsTabId, ShipmentDetailsTabsProps } from "./types";
import { shipmentDetailsTabButtonClass } from "./utils";

export function ShipmentDetailsTabs({
  shipmentId,
  organizationId,
  workflowStatus,
  physicalMailTrackingNumber,
  row,
  detailsContent,
  onActiveTabChange,
  onTrackingEnabled,
}: ShipmentDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<ShipmentDetailsTabId>("details");
  const trackingUnlocked = isShipmentPostApproval(workflowStatus);

  const selectTab = (tab: ShipmentDetailsTabId) => {
    if (tab === "tracking" && !trackingUnlocked) return;
    setActiveTab(tab);
    onActiveTabChange?.(tab);
  };

  const trackingTabButton = (
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === "tracking"}
      id="shipment-tab-tracking"
      aria-controls="shipment-tabpanel-tracking"
      disabled={!trackingUnlocked}
      className={shipmentDetailsTabButtonClass(activeTab === "tracking", !trackingUnlocked)}
      onClick={() => selectTab("tracking")}
    >
      <Route className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
      Tracking
    </button>
  );

  return (
    <div className={SHIPMENT_DETAILS_TAB_PANEL_CLASS}>
      <div className={SHIPMENT_DETAILS_TAB_TITLE_CLASS}>
        <ShipmentTitleHeading row={row} workflowStatus={workflowStatus} />
      </div>
      <div className={SHIPMENT_DETAILS_TAB_LIST_CLASS} role="tablist" aria-label="Shipment workspace">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "details"}
          id="shipment-tab-details"
          aria-controls="shipment-tabpanel-details"
          className={workspaceTabButtonClass(activeTab === "details")}
          onClick={() => selectTab("details")}
        >
          <List className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Details
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "documents"}
          id="shipment-tab-documents"
          aria-controls="shipment-tabpanel-documents"
          className={workspaceTabButtonClass(activeTab === "documents")}
          onClick={() => selectTab("documents")}
        >
          <FileText className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Documents
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "messages"}
          id="shipment-tab-messages"
          aria-controls="shipment-tabpanel-messages"
          className={workspaceTabButtonClass(activeTab === "messages")}
          onClick={() => selectTab("messages")}
        >
          <MessageSquare className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Messages
        </button>
        {trackingUnlocked ? (
          <div className={SHIPMENT_TRACKING_TAB_SLOT_CLASS}>{trackingTabButton}</div>
        ) : (
          <ActionHoverTooltip
            label={SHIPMENT_TRACKING_TAB_DISABLED_TOOLTIP}
            labelClassName={SHIPMENT_TRACKING_TAB_DISABLED_TOOLTIP_CLASS}
            wrapperClassName={`${SHIPMENT_TRACKING_TAB_SLOT_CLASS} w-full`}
          >
            {trackingTabButton}
          </ActionHoverTooltip>
        )}
      </div>

      {activeTab === "details" ? (
        <div
          id="shipment-tabpanel-details"
          role="tabpanel"
          aria-labelledby="shipment-tab-details"
          className={SHIPMENT_DETAILS_TAB_DETAILS_PANEL_CLASS}
        >
          {detailsContent}
        </div>
      ) : null}

      {activeTab === "documents" ? (
        <div
          id="shipment-tabpanel-documents"
          role="tabpanel"
          aria-labelledby="shipment-tab-documents"
          className={SHIPMENT_DETAILS_TAB_DOCUMENTS_PANEL_CLASS}
        >
          <ShipmentWorkspaceScopePanel shipmentId={shipmentId} variant="tab" />
        </div>
      ) : null}

      {activeTab === "messages" ? (
        <div
          id="shipment-tabpanel-messages"
          role="tabpanel"
          aria-labelledby="shipment-tab-messages"
          className={SHIPMENT_DETAILS_TAB_MESSAGES_PANEL_CLASS}
        >
          <ShipmentMessagesPanel shipmentId={shipmentId} />
        </div>
      ) : null}

      {activeTab === "tracking" && trackingUnlocked ? (
        <div
          id="shipment-tabpanel-tracking"
          role="tabpanel"
          aria-labelledby="shipment-tab-tracking"
          className={SHIPMENT_DETAILS_TAB_TRACKING_PANEL_CLASS}
        >
          <ShipmentTrackingPanel
            shipmentId={shipmentId}
            organizationId={organizationId}
            workflowStatus={workflowStatus}
            physicalMailTrackingNumber={physicalMailTrackingNumber}
            onEnabled={onTrackingEnabled}
          />
        </div>
      ) : null}
    </div>
  );
}
