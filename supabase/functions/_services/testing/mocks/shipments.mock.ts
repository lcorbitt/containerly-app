import { inviteTestState } from "../invite-test-state.ts";

export { fetchShipmentPortalHeader } from "../../../_models/shipments.ts";

export async function fetchShipmentIdAndOrganization(_client: unknown, _shipmentId: string) {
  return {
    data: { organization_id: inviteTestState.shipmentOrganizationId },
    error: null,
  };
}

export async function fetchShipmentPortalOperatorRow(_admin: unknown, _shipmentId: string) {
  return { data: null, error: null };
}
