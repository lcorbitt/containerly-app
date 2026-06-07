import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import type { SuggestShipmentActionsInput } from "@/utils/shipment-actions";

export function operatorShipmentSuggestionContext(
  row: ShipmentWorkspaceRow,
): Omit<SuggestShipmentActionsInput, "audience"> {
  return {
    triageBucketKey: row.context.triage_bucket_key,
    workflowStatus: row.workflow_status,
    lastMessageAuthorKind:
      row.metrics.message_count > 0 && row.insight_cards.some((c) => c.id === "customer_waiting")
        ? "customer"
        : null,
  };
}
