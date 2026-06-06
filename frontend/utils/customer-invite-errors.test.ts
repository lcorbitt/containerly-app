import {
  CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR,
  CUSTOMER_INVITE_SUPERADMIN_EMAIL_ERROR,
  isCustomerInviteOperatorEmailError,
} from "./customer-invite-errors";

describe("isCustomerInviteOperatorEmailError", () => {
  it("matches exact operator error message", () => {
    expect(isCustomerInviteOperatorEmailError(CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR)).toBe(true);
  });

  it("matches exact superadmin error message", () => {
    expect(isCustomerInviteOperatorEmailError(CUSTOMER_INVITE_SUPERADMIN_EMAIL_ERROR)).toBe(true);
  });

  it("matches partial organization team message", () => {
    expect(
      isCustomerInviteOperatorEmailError("Cannot invite organization team (admin or member) email"),
    ).toBe(true);
  });

  it("matches partial platform administrator message", () => {
    expect(isCustomerInviteOperatorEmailError("Blocked: platform administrator account")).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isCustomerInviteOperatorEmailError("Valid invited_email required")).toBe(false);
  });
});
