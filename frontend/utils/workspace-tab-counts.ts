import { buildShipmentTimelineEvents } from "@/components/ShipmentTimeline/utils";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { ReportMessage, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";

export function countShipmentScopeTrackingEvents(input: {
  activityEvents?: ShipmentActivityEvent[];
  carrierEvents?: PublicTimelineEvent[];
}): number {
  return buildShipmentTimelineEvents({
    activityEvents: input.activityEvents,
    carrierEvents: input.carrierEvents,
  }).length;
}

export function countShipmentScopeDocuments(attachments: WorkspaceAttachment[]): number {
  return attachments.length;
}

export function countShipmentScopeMessages(messages: ReportMessage[]): number {
  return messages.filter((m) => !m.is_internal).length;
}
