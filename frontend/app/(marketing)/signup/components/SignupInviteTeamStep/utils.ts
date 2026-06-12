import type { SignupInviteRow } from "./types";

let inviteRowCounter = 0;

export function createInviteRow(role: SignupInviteRow["role"] = "member"): SignupInviteRow {
  inviteRowCounter += 1;
  return { id: `invite-${inviteRowCounter}`, email: "", role };
}

export function filledInviteRows(rows: SignupInviteRow[]): SignupInviteRow[] {
  return rows.filter((row) => row.email.trim() !== "");
}
