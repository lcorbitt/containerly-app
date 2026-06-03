"use client";

import { useMemo, useState } from "react";
import { formatWorkspaceTabLabel } from "@/utils/workspace-tab-panel";
import type { ShipmentAccessTabContentState } from "../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import {
  SHIPMENT_ACCESS_SIDEBAR_TAB_CUSTOMER_LABEL,
  SHIPMENT_ACCESS_SIDEBAR_TAB_OPERATOR_LABEL,
} from "./constants";
import type { ShipmentAccessSidebarTabId } from "./types";

export function useShipmentAccessSidebar(state: ShipmentAccessTabContentState) {
  const [activeTab, setActiveTab] = useState<ShipmentAccessSidebarTabId>("operator");

  const customerAttentionCount = useMemo(
    () => state.pendingAccessRequests.length + state.pendingInvites.length,
    [state.pendingAccessRequests.length, state.pendingInvites.length],
  );

  const customerTabLabel =
    customerAttentionCount > 0
      ? formatWorkspaceTabLabel(SHIPMENT_ACCESS_SIDEBAR_TAB_CUSTOMER_LABEL, customerAttentionCount)
      : SHIPMENT_ACCESS_SIDEBAR_TAB_CUSTOMER_LABEL;

  return {
    activeTab,
    setActiveTab,
    isOperatorTab: activeTab === "operator",
    isCustomerTab: activeTab === "customer",
    operatorTabLabel: SHIPMENT_ACCESS_SIDEBAR_TAB_OPERATOR_LABEL,
    customerTabLabel,
  };
}
