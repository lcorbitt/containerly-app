"use client";

import { Reveal } from "@/components/Reveal";
import {
  WORKSPACE_TAB_CONTENTS_CLASS,
  WORKSPACE_TAB_DOCUMENTS_PANEL_CLASS,
  WORKSPACE_TAB_LIST_CLASS,
  WORKSPACE_TAB_MESSAGES_PANEL_CLASS,
  WORKSPACE_TAB_PANEL_CLASS,
  WORKSPACE_TAB_REVEAL_CLASS,
  WORKSPACE_TAB_STACK_SLOT_CLASS,
  WORKSPACE_TAB_TIMELINE_PANEL_CLASS,
} from "@/components/WorkspaceTabShell/constants";
import {
  WorkspaceDocumentsTabIcon,
  WorkspaceMessagesTabIcon,
  WorkspaceTimelineTabIcon,
} from "@/components/WorkspaceTabShell/tab-icons";
import { formatWorkspaceTabLabel, workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import type { PortalDetailsTabId, PortalDetailsTabsProps } from "./types";

export function PortalDetailsTabs({
  activeTab,
  onTabChange,
  tabCounts,
  timelinePanel,
  documentsPanel,
  messagesPanel,
}: PortalDetailsTabsProps) {
  const isTimelineTab = activeTab === "timeline";
  const isDocumentsTab = activeTab === "documents";
  const isMessagesTab = activeTab === "messages";

  return (
    <div className={WORKSPACE_TAB_PANEL_CLASS}>
      <div className={WORKSPACE_TAB_LIST_CLASS} role="tablist" aria-label="Shipment portal">
        <button
          type="button"
          role="tab"
          aria-selected={isTimelineTab}
          id="portal-tab-timeline"
          aria-controls="portal-tabpanel-timeline"
          className={workspaceTabButtonClass(isTimelineTab)}
          onClick={() => onTabChange("timeline")}
        >
          <WorkspaceTimelineTabIcon />
          {formatWorkspaceTabLabel("Timeline", tabCounts.timeline)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isDocumentsTab}
          id="portal-tab-documents"
          aria-controls="portal-tabpanel-documents"
          className={workspaceTabButtonClass(isDocumentsTab)}
          onClick={() => onTabChange("documents")}
        >
          <WorkspaceDocumentsTabIcon />
          {formatWorkspaceTabLabel("Documents", tabCounts.documents)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isMessagesTab}
          id="portal-tab-messages"
          aria-controls="portal-tabpanel-messages"
          className={workspaceTabButtonClass(isMessagesTab)}
          onClick={() => onTabChange("messages")}
        >
          <WorkspaceMessagesTabIcon />
          {formatWorkspaceTabLabel("Messages", tabCounts.messages)}
        </button>
      </div>

      <div className={WORKSPACE_TAB_CONTENTS_CLASS}>
        <div
          id="portal-tabpanel-timeline"
          role="tabpanel"
          aria-labelledby="portal-tab-timeline"
          aria-hidden={!isTimelineTab}
          tabIndex={isTimelineTab ? 0 : -1}
          className={`${WORKSPACE_TAB_STACK_SLOT_CLASS} ${isTimelineTab ? "" : "pointer-events-none invisible"}`}
        >
          <Reveal show={isTimelineTab} keepMounted className={WORKSPACE_TAB_REVEAL_CLASS}>
            <div className={WORKSPACE_TAB_TIMELINE_PANEL_CLASS}>{timelinePanel}</div>
          </Reveal>
        </div>

        <div
          id="portal-tabpanel-documents"
          role="tabpanel"
          aria-labelledby="portal-tab-documents"
          aria-hidden={!isDocumentsTab}
          tabIndex={isDocumentsTab ? 0 : -1}
          className={`${WORKSPACE_TAB_STACK_SLOT_CLASS} ${isDocumentsTab ? "" : "pointer-events-none invisible"}`}
        >
          <Reveal show={isDocumentsTab} keepMounted className={WORKSPACE_TAB_REVEAL_CLASS}>
            <div className={WORKSPACE_TAB_DOCUMENTS_PANEL_CLASS}>{documentsPanel}</div>
          </Reveal>
        </div>

        <div
          id="portal-tabpanel-messages"
          role="tabpanel"
          aria-labelledby="portal-tab-messages"
          aria-hidden={!isMessagesTab}
          tabIndex={isMessagesTab ? 0 : -1}
          className={`${WORKSPACE_TAB_STACK_SLOT_CLASS} ${isMessagesTab ? "" : "pointer-events-none invisible"}`}
        >
          <Reveal show={isMessagesTab} keepMounted className={WORKSPACE_TAB_REVEAL_CLASS}>
            <div className={WORKSPACE_TAB_MESSAGES_PANEL_CLASS}>{messagesPanel}</div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export type { PortalDetailsTabId, PortalDetailsTabsProps } from "./types";
