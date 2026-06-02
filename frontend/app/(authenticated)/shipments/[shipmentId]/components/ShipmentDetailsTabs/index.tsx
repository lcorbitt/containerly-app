"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import {
  WorkspaceDocumentsTabIcon,
  WorkspaceMessagesTabIcon,
  WorkspaceTrackingTabIcon,
} from "@/components/WorkspaceTabShell/tab-icons";
import { formatWorkspaceTabLabel, workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { ShipmentMessagesPanel } from "../ShipmentMessagesPanel";
import { ShipmentTrackingPanel } from "../ShipmentTrackingPanel";
import { ShipmentWorkspaceScopePanel } from "../ShipmentWorkspaceScopePanel";
import {
  SHIPMENT_DETAILS_TAB_CONTENTS_CLASS,
  SHIPMENT_DETAILS_TAB_DOCUMENTS_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_LIST_CLASS,
  SHIPMENT_DETAILS_TAB_MESSAGES_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_REVEAL_CLASS,
  SHIPMENT_DETAILS_TAB_STACK_SLOT_CLASS,
  SHIPMENT_DETAILS_TAB_TRACKING_PANEL_CLASS,
} from "./constants";
import type { ShipmentDetailsTabId, ShipmentDetailsTabsProps } from "./types";
import { useShipmentDetailsTabs } from "./useShipmentDetailsTabs";

export function ShipmentDetailsTabs({
  shipmentId,
  organizationId,
  workflowStatus,
  physicalMailTrackingNumber,
  activityEvents = [],
  carrierEvents = [],
  metrics,
  detailsContent,
  activeTab: controlledActiveTab,
  onTabChange,
  onActiveTabChange,
  onTrackingEnabled,
}: ShipmentDetailsTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<ShipmentDetailsTabId>("tracking");
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const selectTab = (tab: ShipmentDetailsTabId) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
    onActiveTabChange?.(tab);
  };

  const isTrackingTab = activeTab === "tracking";
  const isDocumentsTab = activeTab === "documents";
  const isMessagesTab = activeTab === "messages";

  const { trackingCount, documentsCount, messagesCount } = useShipmentDetailsTabs({
    shipmentId,
    organizationId,
    activityEvents,
    carrierEvents,
  });

  return (
    <div className={SHIPMENT_DETAILS_TAB_PANEL_CLASS}>
      <div className={SHIPMENT_DETAILS_TAB_LIST_CLASS} role="tablist" aria-label="Shipment workspace">
        <button
          type="button"
          role="tab"
          aria-selected={isTrackingTab}
          id="shipment-tab-tracking"
          aria-controls="shipment-tabpanel-tracking"
          className={workspaceTabButtonClass(isTrackingTab)}
          onClick={() => selectTab("tracking")}
        >
          <WorkspaceTrackingTabIcon />
          {formatWorkspaceTabLabel("Tracking", trackingCount)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isDocumentsTab}
          id="shipment-tab-documents"
          aria-controls="shipment-tabpanel-documents"
          className={workspaceTabButtonClass(isDocumentsTab)}
          onClick={() => selectTab("documents")}
        >
          <WorkspaceDocumentsTabIcon />
          {formatWorkspaceTabLabel("Documents", documentsCount)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isMessagesTab}
          id="shipment-tab-messages"
          aria-controls="shipment-tabpanel-messages"
          className={workspaceTabButtonClass(isMessagesTab)}
          onClick={() => selectTab("messages")}
        >
          <WorkspaceMessagesTabIcon />
          {formatWorkspaceTabLabel("Messages", messagesCount)}
        </button>
      </div>

      <div className={SHIPMENT_DETAILS_TAB_CONTENTS_CLASS}>
        <div
          id="shipment-tabpanel-tracking"
          role="tabpanel"
          aria-labelledby="shipment-tab-tracking"
          aria-hidden={!isTrackingTab}
          tabIndex={isTrackingTab ? 0 : -1}
          className={`${SHIPMENT_DETAILS_TAB_STACK_SLOT_CLASS} ${isTrackingTab ? "" : "pointer-events-none invisible"}`}
        >
          <Reveal show={isTrackingTab} keepMounted className={SHIPMENT_DETAILS_TAB_REVEAL_CLASS}>
            <div className={SHIPMENT_DETAILS_TAB_TRACKING_PANEL_CLASS}>
              <ShipmentTrackingPanel
                shipmentId={shipmentId}
                organizationId={organizationId}
                workflowStatus={workflowStatus}
                physicalMailTrackingNumber={physicalMailTrackingNumber}
                activityEvents={activityEvents}
                carrierEvents={carrierEvents}
                metrics={metrics}
                onEnabled={onTrackingEnabled}
              />
              {detailsContent ? (
                <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">{detailsContent}</div>
              ) : null}
            </div>
          </Reveal>
        </div>

        <div
          id="shipment-tabpanel-documents"
          role="tabpanel"
          aria-labelledby="shipment-tab-documents"
          aria-hidden={!isDocumentsTab}
          tabIndex={isDocumentsTab ? 0 : -1}
          className={`${SHIPMENT_DETAILS_TAB_STACK_SLOT_CLASS} ${isDocumentsTab ? "" : "pointer-events-none invisible"}`}
        >
          <Reveal show={isDocumentsTab} keepMounted className={SHIPMENT_DETAILS_TAB_REVEAL_CLASS}>
            <div className={SHIPMENT_DETAILS_TAB_DOCUMENTS_PANEL_CLASS}>
              <ShipmentWorkspaceScopePanel shipmentId={shipmentId} variant="tab" />
            </div>
          </Reveal>
        </div>

        <div
          id="shipment-tabpanel-messages"
          role="tabpanel"
          aria-labelledby="shipment-tab-messages"
          aria-hidden={!isMessagesTab}
          tabIndex={isMessagesTab ? 0 : -1}
          className={`${SHIPMENT_DETAILS_TAB_STACK_SLOT_CLASS} ${isMessagesTab ? "" : "pointer-events-none invisible"}`}
        >
          <Reveal show={isMessagesTab} keepMounted className={SHIPMENT_DETAILS_TAB_REVEAL_CLASS}>
            <div className={SHIPMENT_DETAILS_TAB_MESSAGES_PANEL_CLASS}>
              <ShipmentMessagesPanel shipmentId={shipmentId} pinToLatest={isMessagesTab} />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
