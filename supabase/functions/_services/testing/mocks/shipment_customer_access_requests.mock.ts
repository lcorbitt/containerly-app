export async function approvePendingAccessRequestsForEmail(
  _admin: unknown,
  _shipmentId: string,
  _email: string,
  _metadata: Record<string, unknown>,
) {
  return { error: null };
}

export async function fetchAccessRequestById() {
  return { data: null, error: null };
}

export async function fetchPendingAccessRequestByEmailForShipment() {
  return { data: null, error: null };
}

export async function insertShipmentCustomerAccessRequest() {
  return { data: null, error: null };
}

export async function updateAccessRequest() {
  return { error: null };
}
