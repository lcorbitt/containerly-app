/**
 * Keep shipment timeline message activity rows in sync when thread messages are edited.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const MESSAGE_EVENT_TYPES = ["customer_message", "operator_message"] as const;
const MESSAGE_PREVIEW_MAX_LEN = 120;

function truncatePreview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= MESSAGE_PREVIEW_MAX_LEN) return trimmed;
  return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX_LEN - 1)}…`;
}

async function listActivityEventsLinkedToReportMessage(
  client: SupabaseClient,
  reportMessageId: string,
): Promise<{ id: string; metadata: Record<string, unknown> }[]> {
  const { data, error } = await client
    .from("shipment_activity_events")
    .select("id, metadata")
    .eq("report_message_id", reportMessageId)
    .in("event_type", [...MESSAGE_EVENT_TYPES]);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

/** Rewrite body + preview on timeline rows linked to an edited thread message. */
export async function syncActivityEventsForEditedReportMessage(
  client: SupabaseClient,
  args: { reportMessageId: string; body: string },
): Promise<void> {
  const body = args.body.trim();
  if (!body) return;

  const preview = truncatePreview(body);
  const events = await listActivityEventsLinkedToReportMessage(client, args.reportMessageId);

  for (const event of events) {
    const metadata = {
      ...event.metadata,
      message_preview: preview,
    };
    const { error } = await client
      .from("shipment_activity_events")
      .update({ body, metadata })
      .eq("id", event.id);
    if (error) throw error;
  }
}
