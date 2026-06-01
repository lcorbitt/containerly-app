export type OrgMemberInviteStatus = "pending" | "accepted" | "direct";

export function deriveOrgMemberInviteStatus(input: {
  invitedAt: string | null;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
}): { status: OrgMemberInviteStatus; acceptedAt: string | null } {
  if (!input.invitedAt) {
    return { status: "direct", acceptedAt: input.emailConfirmedAt ?? input.lastSignInAt };
  }

  const acceptedAt = input.emailConfirmedAt ?? input.lastSignInAt;
  if (acceptedAt) {
    return { status: "accepted", acceptedAt };
  }

  return { status: "pending", acceptedAt: null };
}

export function orgMemberInviteStatusLabel(status: OrgMemberInviteStatus): string {
  if (status === "pending") return "Pending";
  if (status === "accepted") return "Accepted";
  return "Direct add";
}
