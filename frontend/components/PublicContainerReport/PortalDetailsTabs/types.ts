import type { ReactNode } from "react";

export type PortalDetailsTabId = "tracking" | "documents" | "messages" | "activity";

export interface PortalDetailsTabsProps {
  activeTab: PortalDetailsTabId;
  onTabChange: (tab: PortalDetailsTabId) => void;
  hasTracking: boolean;
  trackingPanel: ReactNode;
  documentsPanel: ReactNode;
  messagesPanel: ReactNode;
  activityPanel: ReactNode;
}
