import { inviteTestState } from "../invite-test-state.ts";

export {
  fetchProfileRole,
  fetchProfileEmailByUserId,
  fetchProfileEmailsByUserIds,
  fetchProfileImagePathsByUserIds,
  updateProfileAccountKind,
} from "../../../_models/profiles.ts";

export async function fetchProfileIdAndRoleByEmail(
  _admin: unknown,
  _email: string,
) {
  if (inviteTestState.blockOperatorEmail) {
    return { data: { id: "operator-user", role: "member" } };
  }
  return { data: null };
}

export async function fetchProfileIdByEmail(_admin: unknown, _email: string) {
  return { data: null };
}
