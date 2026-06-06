import { parseCustomerInviteRecipients } from "./customer-invite-recipients";

describe("parseCustomerInviteRecipients", () => {
  it("parses comma-separated emails", () => {
    expect(parseCustomerInviteRecipients("a@x.com, b@y.com")).toEqual({
      emails: ["a@x.com", "b@y.com"],
      invalidTokens: [],
    });
  });

  it("dedupes emails case-insensitively", () => {
    expect(parseCustomerInviteRecipients("A@x.com, a@x.com")).toEqual({
      emails: ["a@x.com"],
      invalidTokens: [],
    });
  });

  it("collects invalid tokens alongside valid emails", () => {
    expect(parseCustomerInviteRecipients("bad, a@x.com")).toEqual({
      emails: ["a@x.com"],
      invalidTokens: ["bad"],
    });
  });

  it("rejects tokens missing @ or with leading/trailing @", () => {
    expect(parseCustomerInviteRecipients("@foo.com, foo@, team@company.com")).toEqual({
      emails: ["team@company.com"],
      invalidTokens: ["@foo.com", "foo@"],
    });
  });

  it("ignores empty segments from extra commas", () => {
    expect(parseCustomerInviteRecipients("a@x.com,, ,b@y.com")).toEqual({
      emails: ["a@x.com", "b@y.com"],
      invalidTokens: [],
    });
  });

  it("trims whitespace around tokens", () => {
    expect(parseCustomerInviteRecipients("  a@x.com  ,  b@y.com  ")).toEqual({
      emails: ["a@x.com", "b@y.com"],
      invalidTokens: [],
    });
  });
});
