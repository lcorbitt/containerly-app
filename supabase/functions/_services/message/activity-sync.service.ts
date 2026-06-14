/**
 * Keep shipment timeline message activity rows in sync when thread messages are edited.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  listMessageActivityEventsForShipmentMessage,
  updateShipmentActivityEventBody,
} from "@models/shipment_activity_events.ts";

const MESSAGE_PREVIEW_MAX_LEN = 120;

function truncatePreview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= MESSAGE_PREVIEW_MAX_LEN) return trimmed;
  return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX_LEN - 1)}…`;
}

/** Rewrite body + preview on timeline rows linked to an edited thread message. */
export async function syncActivityEventsForEditedShipmentMessage(
  client: SupabaseClient,
  args: { shipmentMessageId: string; body: string },
): Promise<void> {
  const body = args.body.trim();
  if (!body) return;

  const preview = truncatePreview(body);
  const { data, error } = await listMessageActivityEventsForShipmentMessage(
    client,
    args.shipmentMessageId,
  );
  if (error) throw error;

  for (const row of data ?? []) {
    const metadata = {
      ...((row.metadata as Record<string, unknown>) ?? {}),
      message_preview: preview,
    };
    const { error: updateErr } = await updateShipmentActivityEventBody(
      client,
      row.id as string,
      body,
      metadata,
    );
    if (updateErr) throw updateErr;
  }
}
