"use client";

import { CustomerAccessPanel } from "../../CustomerAccessPanel";
import { ShipmentPendingAccessRequests } from "../../ShipmentPendingAccessRequests";
import type { ShipmentAccessTabContentState } from "../../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";

export interface ShipmentCustomerTabContentProps {
  state: ShipmentAccessTabContentState;
}

export function ShipmentCustomerTabContent({ state }: ShipmentCustomerTabContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <ShipmentPendingAccessRequests state={state} />
      <CustomerAccessPanel
        variant="sidebar"
        inviteEmail={state.inviteEmail}
        onInviteEmailChange={state.setInviteEmail}
        deliveryMode={state.inviteDeliveryMode}
        onDeliveryModeChange={state.setInviteDeliveryMode}
        creating={state.inviteCreating}
        onCreateInvite={() => void state.createInvite()}
        lastInviteUrl={state.lastInviteUrl}
        onClearLastInviteUrl={() => state.setLastInviteUrl(null)}
        pendingInvites={state.pendingInvites}
        activeAccess={state.activeAccessWithLabels}
        origin={state.origin}
        onRevokeInvite={state.revokeInviteRow}
        onRevokeAccess={state.revokeAccessRow}
        onToast={state.toast}
        onReloadAccess={() => state.load()}
      />
    </div>
  );
}
