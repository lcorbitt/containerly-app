import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";
import type { TriageBucketKey } from "@/utils/dashboard-metrics";

export type ShipmentActionHandlerKey =
  | "reply_to_customer"
  | "request_missing_document"
  | "notify_customer_delay"
  | "escalate_to_carrier"
  | "set_risk_level"
  | "review_documents";

export interface ShipmentActionDefinition {
  id: string;
  label: string;
  description: string | null;
  handler_key: ShipmentActionHandlerKey;
  priority: number;
  messageTemplate?: string;
}

export const SHIPMENT_ACTION_DEFINITIONS: ShipmentActionDefinition[] = [
  {
    id: "reply_to_customer",
    label: "Reply to customer",
    description: "Send an acknowledgment on the shipment thread.",
    handler_key: "reply_to_customer",
    priority: 10,
    messageTemplate:
      "Thanks for your message — we're reviewing this shipment and will follow up shortly with an update.",
  },
  {
    id: "request_missing_document",
    label: "Request missing document",
    description: "Ask the customer to upload required drafts.",
    handler_key: "request_missing_document",
    priority: 20,
    messageTemplate:
      "We're still waiting on draft documents for this shipment. Please upload the required files in the Documents tab when ready.",
  },
  {
    id: "notify_customer_delay",
    label: "Notify customer of delay",
    description: "Proactive delay update with risk context.",
    handler_key: "notify_customer_delay",
    priority: 30,
    messageTemplate:
      "We wanted to let you know this shipment may be delayed based on the latest carrier update. We're monitoring closely and will share updates as we receive them.",
  },
  {
    id: "escalate_to_carrier",
    label: "Escalate to carrier",
    description: "Internal note to chase carrier status.",
    handler_key: "escalate_to_carrier",
    priority: 40,
    messageTemplate:
      "Escalating with the carrier for a fresh milestone update on this container.",
  },
  {
    id: "review_documents",
    label: "Review documents",
    description: "Open the documents tab for customer review items.",
    handler_key: "review_documents",
    priority: 50,
  },
  {
    id: "set_risk_level",
    label: "Set risk level",
    description: "Update customer-visible risk on the portal.",
    handler_key: "set_risk_level",
    priority: 60,
  },
];

export function actionDefinitionById(id: string): ShipmentActionDefinition | undefined {
  return SHIPMENT_ACTION_DEFINITIONS.find((a) => a.id === id);
}

export function suggestShipmentActions(input: {
  triageBucketKey?: TriageBucketKey | null;
  workflowStatus?: string | null;
  lastMessageAuthorKind?: string | null;
  hasPastEta?: boolean;
}): SuggestedShipmentAction[] {
  const suggestions: SuggestedShipmentAction[] = [];

  const push = (id: string) => {
    const def = actionDefinitionById(id);
    if (!def) return;
    if (suggestions.some((s) => s.id === id)) return;
    suggestions.push({
      id: def.id,
      label: def.label,
      description: def.description,
      handler_key: def.handler_key,
      priority: def.priority,
    });
  };

  if (input.triageBucketKey === "customer" || input.lastMessageAuthorKind === "customer") {
    push("reply_to_customer");
  }
  if (input.triageBucketKey === "docs" || input.workflowStatus === "pending_drafts") {
    push("request_missing_document");
  }
  if (input.triageBucketKey === "eta" || input.hasPastEta) {
    push("notify_customer_delay");
  }
  if (input.triageBucketKey === "exceptions") {
    push("escalate_to_carrier");
    push("set_risk_level");
  }
  if (input.workflowStatus === "awaiting_review") {
    push("review_documents");
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

export function messageTemplateForAction(actionId: string): string | null {
  return actionDefinitionById(actionId)?.messageTemplate ?? null;
}

export function shipmentActionTabForHandler(handlerKey: ShipmentActionHandlerKey): "messages" | "documents" | null {
  switch (handlerKey) {
    case "reply_to_customer":
    case "request_missing_document":
    case "notify_customer_delay":
    case "escalate_to_carrier":
      return "messages";
    case "review_documents":
      return "documents";
    default:
      return null;
  }
}
