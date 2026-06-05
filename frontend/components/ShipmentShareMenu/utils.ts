import type { ShipmentAccessTabContentState } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import type { ShipmentShareAccessRow } from "./types";

export function buildShipmentShareAccessRows(
  state: Pick<
    ShipmentAccessTabContentState,
    "profileImagePathByUserId" | "activeAccessWithLabels" | "pendingInvites"
  >,
): ShipmentShareAccessRow[] {
  const rows: ShipmentShareAccessRow[] = [];

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

export function shipmentHubUrl(shipmentId: string, origin: string): string {
  const path = `/shipments/hub/${shipmentId}`;
  return origin ? `${origin}${path}` : path;
}
