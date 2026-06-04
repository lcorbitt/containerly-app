/** Keep in sync with `customer-access.service.ts` on Edge. */
export const CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR =
  "This email belongs to someone on your organization team (admin or member). Customer invites are only for external importer contacts.";

export const CUSTOMER_INVITE_SUPERADMIN_EMAIL_ERROR =
  "This email belongs to a platform administrator. Customer invites are only for external importer contacts.";

export function isCustomerInviteOperatorEmailError(message: string): boolean {
  return (
    message === CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR ||
    message === CUSTOMER_INVITE_SUPERADMIN_EMAIL_ERROR ||
    message.includes("organization team (admin or member)") ||
    message.includes("platform administrator")
  );
}
