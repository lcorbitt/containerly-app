export async function notifyCustomerInviteSent(_args: Record<string, unknown>) {
  return { ok: true as const };
}

export async function notifyAssigneeAccessRequest() {
  return undefined;
}

export async function notifyOperatorsCustomerAccessGranted() {
  return undefined;
}

export async function notifyOperatorsNewCustomerMessage() {
  return undefined;
}
