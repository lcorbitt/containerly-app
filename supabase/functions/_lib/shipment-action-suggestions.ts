/**
 * Edge-side shipment action suggestions. Mirrors `frontend/utils/shipment-actions.ts`.
 */

import type { SuggestedShipmentAction } from "@shared/dto/performance.dto.ts";
import type { TriageBucketKey } from "@shared/dto/performance.types.ts";

type ActionDef = {
  id: string;
  label: string;
  description: string | null;
  handler_key: string;
  priority: number;
};

const DEFINITIONS: ActionDef[] = [
  {
    id: "reply_to_customer",
    label: "Reply to customer",
    description: "Send an acknowledgment on the shipment thread.",
    handler_key: "reply_to_customer",
    priority: 10,
  },
  {
    id: "request_missing_document",
    label: "Request missing document",
    description: "Ask the customer to upload required drafts.",
    handler_key: "request_missing_document",
    priority: 20,
  },
  {
    id: "notify_customer_delay",
    label: "Notify customer of delay",
    description: "Proactive delay update with risk context.",
    handler_key: "notify_customer_delay",
    priority: 30,
  },
  {
    id: "escalate_to_carrier",
    label: "Escalate to carrier",
    description: "Internal note to chase carrier status.",
    handler_key: "escalate_to_carrier",
    priority: 40,
  },
];

function defById(id: string): ActionDef | undefined {
  return DEFINITIONS.find((d) => d.id === id);
}

export function suggestShipmentActions(input: {
  triage_bucket_key?: TriageBucketKey | null;
  workflow_status?: string | null;
  last_message_author_kind?: string | null;
}): SuggestedShipmentAction[] {
  const out: SuggestedShipmentAction[] = [];
  const push = (id: string) => {
    const def = defById(id);
    if (!def || out.some((row) => row.id === id)) return;
    out.push({
      id: def.id,
      label: def.label,
      description: def.description,
      handler_key: def.handler_key,
      priority: def.priority,
    });
  };

  if (input.triage_bucket_key === "customer" || input.last_message_author_kind === "customer") {
    push("reply_to_customer");
  }
  if (input.triage_bucket_key === "docs" || input.workflow_status === "pending_drafts") {
    push("request_missing_document");
  }
  if (input.triage_bucket_key === "eta") push("notify_customer_delay");
  if (input.triage_bucket_key === "exceptions") push("escalate_to_carrier");

  return out.sort((a, b) => a.priority - b.priority).slice(0, 4);
}
