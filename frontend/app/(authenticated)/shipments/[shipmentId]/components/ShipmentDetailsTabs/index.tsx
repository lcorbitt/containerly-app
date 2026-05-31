"use client";

import { FileText, MessageSquare, Route } from "lucide-react";
import { useState } from "react";
import { workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { ShipmentMessagesPanel } from "../ShipmentMessagesPanel";
import { ShipmentTrackingPanel } from "../ShipmentTrackingPanel";
import { ShipmentWorkspaceScopePanel } from "../ShipmentWorkspaceScopePanel";
import {
  SHIPMENT_DETAILS_TAB_DOCUMENTS_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_LIST_CLASS,
  SHIPMENT_DETAILS_TAB_MESSAGES_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_TRACKING_PANEL_CLASS,
} from "./constants";
import type { ShipmentDetailsTabId, ShipmentDetailsTabsProps } from "./types";

export function ShipmentDetailsTabs({
  shipmentId,
  organizationId,
  workflowStatus,
  physicalMailTrackingNumber,
  activityEvents = [],
  detailsContent,
  onActiveTabChange,
  onTrackingEnabled,
}: ShipmentDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<ShipmentDetailsTabId>("tracking");

  const selectTab = (tab: ShipmentDetailsTabId) => {
    setActiveTab(tab);
    onActiveTabChange?.(tab);
  };

  return (
    <div className={SHIPMENT_DETAILS_TAB_PANEL_CLASS}>
      <div className={SHIPMENT_DETAILS_TAB_LIST_CLASS} role="tablist" aria-label="Shipment workspace">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "tracking"}
          id="shipment-tab-tracking"
          aria-controls="shipment-tabpanel-tracking"
          className={workspaceTabButtonClass(activeTab === "tracking")}
          onClick={() => selectTab("tracking")}
        >
          <Route className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Tracking
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
      </div>

      {activeTab === "tracking" ? (
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
            activityEvents={activityEvents}
            onEnabled={onTrackingEnabled}
          />
          {detailsContent ? <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">{detailsContent}</div> : null}
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
    </div>
  );
}
