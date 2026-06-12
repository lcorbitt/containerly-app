export const inviteTestState = {
  blockOperatorEmail: false,
  shipmentOrganizationId: "11111111-1111-4111-8111-111111111111",
  existingPendingInviteId: null as string | null,
  inserted: false,
  updated: false,
};

export function resetInviteTestState() {
  inviteTestState.blockOperatorEmail = false;
  inviteTestState.shipmentOrganizationId = "11111111-1111-4111-8111-111111111111";
  inviteTestState.existingPendingInviteId = null;
  inviteTestState.inserted = false;
  inviteTestState.updated = false;
}
