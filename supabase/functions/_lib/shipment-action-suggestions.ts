/**
 * Edge-side shipment action suggestions. Mirrors `frontend/utils/shipment-actions.ts`.
 */

import type { SuggestedShipmentAction } from "@shared/dto/performance.dto.ts";
import type { TriageBucketKey } from "@shared/dto/performance.types.ts";

export type ShipmentActionAudience = "operator" | "customer";

type ActionDef = {
  id: string;
  label: string;
  description: string | null;
  handler_key: string;
  priority: number;
  audience: ShipmentActionAudience;
};

const OPERATOR_DEFINITIONS: ActionDef[] = [
  {
    id: "reply_to_customer",
    label: "Reply to customer",
    description: "Send an acknowledgment on the shipment thread.",
    handler_key: "reply_to_customer",
    priority: 10,
    audience: "operator",
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
  },
  {
    id: "escalate_to_carrier",
    label: "Escalate to carrier",
    description: "Internal note to chase carrier status.",
    handler_key: "escalate_to_carrier",
    priority: 40,
    audience: "operator",
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

const CUSTOMER_DEFINITIONS: ActionDef[] = [
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
  },
];

const DEFINITIONS = [...OPERATOR_DEFINITIONS, ...CUSTOMER_DEFINITIONS];

function defById(id: string, audience: ShipmentActionAudience): ActionDef | undefined {
  const def = DEFINITIONS.find((d) => d.id === id);
  return def?.audience === audience ? def : undefined;
}

export function suggestShipmentActions(input: {
  audience: ShipmentActionAudience;
  triage_bucket_key?: TriageBucketKey | null;
  workflow_status?: string | null;
  last_message_author_kind?: string | null;
  has_draft_documents?: boolean;
}): SuggestedShipmentAction[] {
  const out: SuggestedShipmentAction[] = [];
  const push = (id: string) => {
    const def = defById(id, input.audience);
    if (!def || out.some((row) => row.id === id)) return;
    out.push({
      id: def.id,
      label: def.label,
      description: def.description,
      handler_key: def.handler_key,
      priority: def.priority,
    });
  };

  if (input.audience === "operator") {
    if (input.triage_bucket_key === "customer" || input.last_message_author_kind === "customer") {
      push("reply_to_customer");
    }
    if (input.triage_bucket_key === "eta") push("notify_customer_delay");
    if (input.triage_bucket_key === "exceptions") {
      push("escalate_to_carrier");
      push("set_risk_level");
    }
    if (
      !input.has_draft_documents &&
      (input.triage_bucket_key === "docs" || input.workflow_status === "pending_drafts")
    ) {
      push("upload_draft_documents");
    }
  } else {
    if (
      !input.has_draft_documents &&
      (input.triage_bucket_key === "docs" || input.workflow_status === "pending_drafts")
    ) {
      push("request_missing_document");
    }
    if (input.workflow_status === "awaiting_review") push("review_documents");
    if (input.triage_bucket_key === "exceptions") push("report_issue");
  }

  return out.sort((a, b) => a.priority - b.priority).slice(0, 4);
}
