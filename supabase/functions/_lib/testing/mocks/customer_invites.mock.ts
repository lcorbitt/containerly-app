import { inviteTestState } from "../invite-test-state.ts";

export async function fetchPendingInviteForRefresh(
  _admin: unknown,
  _shipmentId: string,
  _email: string,
) {
  if (inviteTestState.existingPendingInviteId) {
    return { data: { id: inviteTestState.existingPendingInviteId } };
  }
  return { data: null };
}

export async function insertCustomerInvite(_admin: unknown, _fields: Record<string, unknown>) {
  inviteTestState.inserted = true;
  return {
    data: {
      id: "invite-new",
      expires_at: "2026-12-31T00:00:00.000Z",
    },
    error: null,
  };
}

export async function updateCustomerInviteById(
  _admin: unknown,
  _id: string,
  _fields: Record<string, unknown>,
) {
  inviteTestState.updated = true;
  return {
    data: {
      id: inviteTestState.existingPendingInviteId ?? "invite-existing",
      expires_at: "2026-12-31T00:00:00.000Z",
    },
    error: null,
  };
}

export async function fetchCustomerInviteByTokenHash() {
  return { data: null, error: null };
}

export async function fetchInviteByEmailForShipment() {
  return { data: null, error: null };
}

export async function updateCustomerInviteStatus() {
  return { error: null };
}
