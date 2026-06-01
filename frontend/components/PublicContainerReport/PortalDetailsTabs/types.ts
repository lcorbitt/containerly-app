import type { ReactNode } from "react";

export type PortalDetailsTabId = "tracking" | "documents" | "messages";

export interface PortalDetailsTabsProps {
  activeTab: PortalDetailsTabId;
  onTabChange: (tab: PortalDetailsTabId) => void;
  trackingPanel: ReactNode;
  documentsPanel: ReactNode;
  messagesPanel: ReactNode;
}
