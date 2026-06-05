import type { ReactNode } from "react";

export type PortalDetailsTabId = "timeline" | "documents" | "messages";

export interface PortalDetailsTabCounts {
  timeline: number;
  documents: number;
  messages: number;
}

export interface PortalDetailsTabsProps {
  activeTab: PortalDetailsTabId;
  onTabChange: (tab: PortalDetailsTabId) => void;
  tabCounts: PortalDetailsTabCounts;
  timelinePanel: ReactNode;
  documentsPanel: ReactNode;
  messagesPanel: ReactNode;
}
