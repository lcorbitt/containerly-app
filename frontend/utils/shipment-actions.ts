import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";
import type { TriageBucketKey } from "@/utils/dashboard-metrics";

export type ShipmentActionAudience = "operator" | "customer";

export type ShipmentActionHandlerKey =
  | "reply_to_customer"
  | "upload_draft_documents"
  | "request_missing_document"
  | "notify_customer_delay"
  | "escalate_to_carrier"
  | "set_risk_level"
  | "review_documents"
  | "report_issue";

export interface ShipmentActionDefinition {
  id: string;
  label: string;
  description: string | null;
  handler_key: ShipmentActionHandlerKey;
  priority: number;
  audience: ShipmentActionAudience;
  messageTemplate?: string;
}

export const OPERATOR_SHIPMENT_ACTION_DEFINITIONS: ShipmentActionDefinition[] = [
  {
    id: "reply_to_customer",
    label: "Reply to customer",
    description: "Send an acknowledgment on the shipment thread.",
    handler_key: "reply_to_customer",
    priority: 10,
    audience: "operator",
    messageTemplate:
      "Thanks for your message — we're reviewing this shipment and will follow up shortly with an update.",
  },
  {
    id: "upload_draft_documents",
    label: "Upload Draft Documents",
    description: "Upload required draft documents for this shipment.",
    handler_key: "upload_draft_documents",
    priority: 20,
    audience: "operator",
  },
  {
    id: "notify_customer_delay",
    label: "Notify customer of delay",
    description: "Proactive delay update with risk context.",
    handler_key: "notify_customer_delay",
    priority: 30,
    audience: "operator",
    messageTemplate:
      "We wanted to let you know this shipment may be delayed based on the latest carrier update. We're monitoring closely and will share updates as we receive them.",
  },
  {
    id: "escalate_to_carrier",
    label: "Escalate to carrier",
    description: "Internal note to chase carrier status.",
    handler_key: "escalate_to_carrier",
    priority: 40,
    audience: "operator",
    messageTemplate:
      "Escalating with the carrier for a fresh milestone update on this container.",
  },
  {
    id: "set_risk_level",
    label: "Set risk level",
    description: "Update customer-visible risk on the portal.",
    handler_key: "set_risk_level",
    priority: 60,
    audience: "operator",
  },
];

export const CUSTOMER_SHIPMENT_ACTION_DEFINITIONS: ShipmentActionDefinition[] = [
  {
    id: "request_missing_document",
    label: "Request missing document",
    description: "Upload required drafts in the documents tab.",
    handler_key: "request_missing_document",
    priority: 20,
    audience: "customer",
  },
  {
    id: "review_documents",
    label: "Review documents",
    description: "Open the documents tab to review drafts and originals.",
    handler_key: "review_documents",
    priority: 50,
    audience: "customer",
  },
  {
    id: "report_issue",
    label: "Report an issue",
    description: "Flag a problem that needs operator attention.",
    handler_key: "report_issue",
    priority: 40,
    audience: "customer",
    messageTemplate:
      "We need to flag an issue with this shipment and would appreciate your guidance.",
  },
];

export const SHIPMENT_ACTION_DEFINITIONS: ShipmentActionDefinition[] = [
  ...OPERATOR_SHIPMENT_ACTION_DEFINITIONS,
  ...CUSTOMER_SHIPMENT_ACTION_DEFINITIONS,
];

export interface SuggestShipmentActionsInput {
  audience: ShipmentActionAudience;
  triageBucketKey?: TriageBucketKey | null;
  workflowStatus?: string | null;
  lastMessageAuthorKind?: string | null;
  hasPastEta?: boolean;
  hasDraftDocuments?: boolean;
}

export function actionDefinitionById(id: string): ShipmentActionDefinition | undefined {
  return SHIPMENT_ACTION_DEFINITIONS.find((a) => a.id === id);
}

function definitionForAudience(id: string, audience: ShipmentActionAudience): ShipmentActionDefinition | undefined {
  const def = actionDefinitionById(id);
  return def?.audience === audience ? def : undefined;
}

export function suggestShipmentActions(input: SuggestShipmentActionsInput): SuggestedShipmentAction[] {
  const suggestions: SuggestedShipmentAction[] = [];

  const push = (id: string) => {
    const def = definitionForAudience(id, input.audience);
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

  if (input.audience === "operator") {
    if (input.triageBucketKey === "customer" || input.lastMessageAuthorKind === "customer") {
      push("reply_to_customer");
    }
    if (input.triageBucketKey === "eta" || input.hasPastEta) {
      push("notify_customer_delay");
    }
    if (input.triageBucketKey === "exceptions") {
      push("escalate_to_carrier");
      push("set_risk_level");
    }
    if (
      !input.hasDraftDocuments &&
      (input.triageBucketKey === "docs" || input.workflowStatus === "pending_drafts")
    ) {
      push("upload_draft_documents");
    }
  } else {
    if (
      !input.hasDraftDocuments &&
      (input.triageBucketKey === "docs" || input.workflowStatus === "pending_drafts")
    ) {
      push("request_missing_document");
    }
    if (input.workflowStatus === "awaiting_review") {
      push("review_documents");
    }
    if (input.triageBucketKey === "exceptions") {
      push("report_issue");
    }
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

export function shipmentActionAudienceFromPortalViewer(
  viewer: "importer" | "org_member" | string,
): ShipmentActionAudience {
  return viewer === "importer" ? "customer" : "operator";
}

export function messageTemplateForAction(actionId: string): string | null {
  return actionDefinitionById(actionId)?.messageTemplate ?? null;
}

export function shipmentActionTabForHandler(
  handlerKey: ShipmentActionHandlerKey,
): "messages" | "documents" | null {
  switch (handlerKey) {
    case "reply_to_customer":
    case "notify_customer_delay":
    case "escalate_to_carrier":
    case "report_issue":
      return "messages";
    case "request_missing_document":
    case "upload_draft_documents":
    case "review_documents":
      return "documents";
    default:
      return null;
  }
}
