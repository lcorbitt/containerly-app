import type { ShipmentAccessTabContentState } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import type { ShipmentShareAccessRow } from "./types";

export function buildShipmentShareAccessRows(
  state: Pick<
    ShipmentAccessTabContentState,
    | "assigneeUserId"
    | "assigneeSelectOptions"
    | "participantRowsWithoutAssignee"
    | "profileImagePathByUserId"
    | "messageAuthorByUserId"
    | "activeAccessWithLabels"
    | "pendingInvites"
  >,
): ShipmentShareAccessRow[] {
  const rows: ShipmentShareAccessRow[] = [];

  if (state.assigneeUserId) {
    const assigneeOption = state.assigneeSelectOptions.find((o) => o.value === state.assigneeUserId);
    const label =
      assigneeOption?.label ||
      state.messageAuthorByUserId[state.assigneeUserId]?.trim() ||
      `User ${state.assigneeUserId.slice(0, 8)}…`;
    rows.push({
      id: `assignee-${state.assigneeUserId}`,
      label,
      avatarUrl:
        assigneeOption?.avatarUrl ??
        getProfileImagePublicUrlBrowser(state.profileImagePathByUserId[state.assigneeUserId] ?? null),
      role: "Assignee",
    });
  }

  for (const participant of state.participantRowsWithoutAssignee) {
    const label =
      state.messageAuthorByUserId[participant.user_id]?.trim() ||
      `User ${participant.user_id.slice(0, 8)}…`;
    rows.push({
      id: participant.id,
      label,
      avatarUrl: getProfileImagePublicUrlBrowser(state.profileImagePathByUserId[participant.user_id] ?? null),
      role: "Participant",
    });
  }

  for (const { access, label } of state.activeAccessWithLabels) {
    rows.push({
      id: access.id,
      label,
      avatarUrl: getProfileImagePublicUrlBrowser(state.profileImagePathByUserId[access.customer_user_id] ?? null),
      role: "Importer",
    });
  }

  for (const invite of state.pendingInvites) {
    rows.push({
      id: invite.id,
      label: invite.invited_email,
      sublabel: "Invite pending",
      avatarUrl: null,
      role: "Pending",
    });
  }

  return rows;
}

export function shipmentPortalUrl(shipmentId: string, origin: string): string {
  const path = `/shipments/hub/${shipmentId}`;
  return origin ? `${origin}${path}` : path;
}
