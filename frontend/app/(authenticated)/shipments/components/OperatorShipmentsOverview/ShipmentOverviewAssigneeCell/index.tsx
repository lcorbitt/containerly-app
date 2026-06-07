import { ActionHoverTooltip } from "@/components/ActionHoverTooltip";
import { UserAvatar } from "@/components/UserAvatar";
import {
  SHIPMENT_OVERVIEW_ASSIGNEE_AVATAR_WRAP_CLASS,
  SHIPMENT_OVERVIEW_ASSIGNEE_UNASSIGNED_CLASS,
} from "./constants";
import type { ShipmentOverviewAssigneeCellProps } from "./types";

export function ShipmentOverviewAssigneeCell({
  assigneeUserId,
  label,
}: ShipmentOverviewAssigneeCellProps) {
  if (!assigneeUserId) {
    return <span className={SHIPMENT_OVERVIEW_ASSIGNEE_UNASSIGNED_CLASS}>Unassigned</span>;
  }

  const displayLabel = label?.trim() || "?";
  const tooltipLabel = label?.trim() || "Assignee";

  return (
    <ActionHoverTooltip label={tooltipLabel}>
      <span tabIndex={0} className={SHIPMENT_OVERVIEW_ASSIGNEE_AVATAR_WRAP_CLASS}>
        <UserAvatar imageUrl={null} label={displayLabel} size="md" />
      </span>
    </ActionHoverTooltip>
  );
}
