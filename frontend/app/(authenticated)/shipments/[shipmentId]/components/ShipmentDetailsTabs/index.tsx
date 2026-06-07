"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import {
  WorkspaceDocumentsTabIcon,
  WorkspaceMessagesTabIcon,
  WorkspaceTimelineTabIcon,
} from "@/components/WorkspaceTabShell/tab-icons";
import { formatWorkspaceTabLabel, workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { ShipmentMessagesPanel } from "../ShipmentMessagesPanel";
import { ShipmentTimelinePanel } from "../ShipmentTimelinePanel";
import { ShipmentWorkspaceScopePanel } from "../ShipmentWorkspaceScopePanel";
import {
  SHIPMENT_DETAILS_TAB_CONTENTS_CLASS,
  SHIPMENT_DETAILS_TAB_DOCUMENTS_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_LIST_CLASS,
  SHIPMENT_DETAILS_TAB_MESSAGES_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_PANEL_CLASS,
  SHIPMENT_DETAILS_TAB_REVEAL_CLASS,
  SHIPMENT_DETAILS_TAB_STACK_SLOT_CLASS,
  SHIPMENT_DETAILS_TAB_TIMELINE_PANEL_CLASS,
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
  detailsContent,
  activeTab: controlledActiveTab,
  onTabChange,
  onActiveTabChange,
  onTrackingEnabled,
}: ShipmentDetailsTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<ShipmentDetailsTabId>("timeline");
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const selectTab = (tab: ShipmentDetailsTabId) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
    onActiveTabChange?.(tab);
  };

  const isTimelineTab = activeTab === "timeline";
  const isDocumentsTab = activeTab === "documents";
  const isMessagesTab = activeTab === "messages";

  const { timelineCount, documentsCount, messagesCount } = useShipmentDetailsTabs({
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
          aria-selected={isTimelineTab}
          id="shipment-tab-timeline"
          aria-controls="shipment-tabpanel-timeline"
          className={workspaceTabButtonClass(isTimelineTab)}
          onClick={() => selectTab("timeline")}
        >
          <WorkspaceTimelineTabIcon />
          {formatWorkspaceTabLabel("Timeline", timelineCount)}
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
          id="shipment-tabpanel-timeline"
          role="tabpanel"
          aria-labelledby="shipment-tab-timeline"
          aria-hidden={!isTimelineTab}
          tabIndex={isTimelineTab ? 0 : -1}
          className={`${SHIPMENT_DETAILS_TAB_STACK_SLOT_CLASS} ${isTimelineTab ? "" : "pointer-events-none invisible"}`}
        >
          <Reveal show={isTimelineTab} keepMounted className={SHIPMENT_DETAILS_TAB_REVEAL_CLASS}>
            <div className={SHIPMENT_DETAILS_TAB_TIMELINE_PANEL_CLASS}>
              <ShipmentTimelinePanel
                shipmentId={shipmentId}
                organizationId={organizationId}
                workflowStatus={workflowStatus}
                physicalMailTrackingNumber={physicalMailTrackingNumber}
                activityEvents={activityEvents}
                carrierEvents={carrierEvents}
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
