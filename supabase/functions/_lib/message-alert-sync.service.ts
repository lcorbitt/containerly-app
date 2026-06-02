/**
 * Keep MESSAGE_* in-app alert copy in sync when a linked report message is edited.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchProfileDisplayName,
  fetchShipmentOrderPhrase,
  formatActorOnShipmentMessage,
} from "./in-app-alerts";

const MESSAGE_PREVIEW_MAX = 160;
const OPERATOR_REPLY_PREVIEW_MAX = 120;

function isOperatorStakeholderReplyAlert(message: string): boolean {
  return message.includes("replied to the customer on ");
}

function rebuildMessageAlertCopy(args: {
  alertType: string;
  existingMessage: string;
  actorName: string;
  orderPhrase: string;
  preview: string;
}): string | null {
  const detail = args.preview.trim();
  if (!detail) return null;

  switch (args.alertType) {
    case "MESSAGE_NEW":
    case "MESSAGE_TEAM":
      return formatActorOnShipmentMessage(
        args.actorName,
        args.orderPhrase,
        detail.slice(0, MESSAGE_PREVIEW_MAX),
      );
    case "MESSAGE_REPLY":
      if (isOperatorStakeholderReplyAlert(args.existingMessage)) {
        return `${args.actorName} replied to the customer on ${args.orderPhrase}: ${detail.slice(0, OPERATOR_REPLY_PREVIEW_MAX)}`;
      }
      return formatActorOnShipmentMessage(
        args.actorName,
        args.orderPhrase,
        detail.slice(0, MESSAGE_PREVIEW_MAX),
      );
    default:
      return null;
  }
}

async function listAlertsLinkedToReportMessage(
  client: SupabaseClient,
  reportMessageId: string,
): Promise<
  { id: string; alert_type: string; actor_user_id: string | null; message: string }[]
> {
  const { data: byFk, error: fkErr } = await client
    .from("alerts")
    .select("id, alert_type, actor_user_id, message")
    .eq("report_message_id", reportMessageId);
  if (fkErr) throw fkErr;

  const { data: byDetails, error: detailsErr } = await client
    .from("alerts")
    .select("id, alert_type, actor_user_id, message")
    .contains("details", { message_id: reportMessageId });
  if (detailsErr) throw detailsErr;

  const seen = new Set<string>();
  const out: { id: string; alert_type: string; actor_user_id: string | null; message: string }[] =
    [];
  for (const row of [...(byFk ?? []), ...(byDetails ?? [])]) {
    const id = row.id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      alert_type: row.alert_type as string,
      actor_user_id: (row.actor_user_id as string | null | undefined) ?? null,
      message: (row.message as string) ?? "",
    });
  }
  return out;
}

/** Rewrite MESSAGE_* alert rows tied to this thread message (FK + legacy details.message_id). */
export async function syncAlertsForEditedReportMessage(
  client: SupabaseClient,
  args: { reportMessageId: string; bodyPreview: string },
): Promise<void> {
  const preview = args.bodyPreview.trim();
  if (!preview) return;

  const { data: msg, error: msgErr } = await client
    .from("report_messages")
    .select("id, shipment_id, author_user_id")
    .eq("id", args.reportMessageId)
    .maybeSingle();
  if (msgErr) throw msgErr;
  const shipmentId = (msg?.shipment_id as string | null | undefined) ?? null;
  if (!shipmentId) return;

  const orderPhrase = await fetchShipmentOrderPhrase(client, shipmentId);
  const alerts = await listAlertsLinkedToReportMessage(client, args.reportMessageId);

  for (const alert of alerts) {
    const actorUserId = alert.actor_user_id ?? (msg?.author_user_id as string | null) ?? null;
    if (!actorUserId) continue;
    const actorName = await fetchProfileDisplayName(client, actorUserId);
    const message = rebuildMessageAlertCopy({
      alertType: alert.alert_type,
      existingMessage: alert.message,
      actorName,
      orderPhrase,
      preview,
    });
    if (!message) continue;

    const { error } = await client.from("alerts").update({ message }).eq("id", alert.id);
    if (error) throw error;
  }
}
