import { buildShipmentTimelineEvents } from "@/components/ShipmentTimeline/utils";
import type { PortalAttachment, ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { ShipmentMessage, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";

export function countShipmentScopeTimelineEvents(input: {
  activityEvents?: ShipmentActivityEvent[];
  carrierEvents?: PublicTimelineEvent[];
}): number {
  return buildShipmentTimelineEvents({
    activityEvents: input.activityEvents,
    carrierEvents: input.carrierEvents,
  }).length;
}

export function countShipmentScopeDocuments(
  attachments: WorkspaceAttachment[] | PortalAttachment[],
): number {
  return attachments.length;
}

export function countShipmentScopeMessages(messages: ShipmentMessage[]): number {
  return messages.filter((m) => !m.is_internal).length;
}

export function hasShipmentDraftDocuments(
  attachments: Pick<WorkspaceAttachment, "document_group">[] | Pick<PortalAttachment, "document_group">[],
): boolean {
  return attachments.some((attachment) => attachment.document_group === "draft");
}
