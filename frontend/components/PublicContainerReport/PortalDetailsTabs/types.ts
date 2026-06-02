import type { ReactNode } from "react";

export type PortalDetailsTabId = "tracking" | "documents" | "messages";

export interface PortalDetailsTabCounts {
  tracking: number;
  documents: number;
  messages: number;
}

export interface PortalDetailsTabsProps {
  activeTab: PortalDetailsTabId;
  onTabChange: (tab: PortalDetailsTabId) => void;
  tabCounts: PortalDetailsTabCounts;
  trackingPanel: ReactNode;
  documentsPanel: ReactNode;
  messagesPanel: ReactNode;
}
