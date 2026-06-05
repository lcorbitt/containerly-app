"use client";

import { ShipmentShareMenu } from "@/components/ShipmentShareMenu";
import { workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { useShipmentAccessTabContent } from "../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { ShipmentCustomerTabContent } from "./ShipmentCustomerTabContent";
import { ShipmentOperatorTabContent } from "./ShipmentOperatorTabContent";
import { SHIPMENT_ACCESS_SIDEBAR_TAB_LIST_CLASS } from "./constants";
import type { ShipmentAccessSidebarProps } from "./types";
import { useShipmentAccessSidebar } from "./useShipmentAccessSidebar";

export function ShipmentAccessSidebar({
  shipmentId,
  initialAssigneeUserId,
  onMetaChanged,
}: ShipmentAccessSidebarProps) {
  const accessState = useShipmentAccessTabContent({ shipmentId, initialAssigneeUserId, onMetaChanged });
  const {
    setActiveTab,
    isOperatorTab,
    isCustomerTab,
    operatorTabLabel,
    customerTabLabel,
  } = useShipmentAccessSidebar(accessState);

  return (
    <section
      aria-label="Shipment team and settings"
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <ShipmentShareMenu shipmentId={shipmentId} state={accessState} variant="sidebar" />
      </div>

      <div className={SHIPMENT_ACCESS_SIDEBAR_TAB_LIST_CLASS} role="tablist" aria-label="Shipment sidebar">
        <button
          type="button"
          role="tab"
          aria-selected={isOperatorTab}
          id="shipment-sidebar-tab-operator"
          aria-controls="shipment-sidebar-tabpanel-operator"
          className={workspaceTabButtonClass(isOperatorTab)}
          onClick={() => setActiveTab("operator")}
        >
          {operatorTabLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isCustomerTab}
          id="shipment-sidebar-tab-customer"
          aria-controls="shipment-sidebar-tabpanel-customer"
          className={workspaceTabButtonClass(isCustomerTab)}
          onClick={() => setActiveTab("customer")}
        >
          {customerTabLabel}
        </button>
      </div>

      {accessState.loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          {isOperatorTab ? (
            <div
              role="tabpanel"
              id="shipment-sidebar-tabpanel-operator"
              aria-labelledby="shipment-sidebar-tab-operator"
            >
              <ShipmentOperatorTabContent shipmentId={shipmentId} state={accessState} />
            </div>
          ) : null}
          {isCustomerTab ? (
            <div
              role="tabpanel"
              id="shipment-sidebar-tabpanel-customer"
              aria-labelledby="shipment-sidebar-tab-customer"
            >
              <ShipmentCustomerTabContent state={accessState} />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
