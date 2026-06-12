import { inviteTestState } from "../invite-test-state.ts";

export async function fetchOrgOperatorMembershipForUser(
  _admin: unknown,
  _organizationId: string,
  _userId: string,
) {
  if (inviteTestState.blockOperatorEmail) {
    return { data: { role: "member" } };
  }
  return { data: null };
}

export async function countMembershipsForUser(_admin: unknown, _userId: string) {
  return { count: 0 };
}
