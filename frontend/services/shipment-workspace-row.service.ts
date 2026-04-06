import { createClient } from "@/lib/supabase/client";
import type { ShipmentOverviewTrackingRow } from "@/lib/operator-shipments-overview-query";

export type ShipmentWorkspaceRow = {
  id: string;
  organization_id: string;
  reference: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  owner_user_id: string | null;
  assignee_user_id: string | null;
  tracking_requests: ShipmentOverviewTrackingRow[];
};

export async function fetchShipmentWorkspaceRow(input: {
  shipmentId: string;
  organizationId: string;
}): Promise<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data, error: qErr } = await supabase
    .from("shipments")
    .select(
      `
          id,
          organization_id,
          reference,
          bill_of_lading,
          shipping_line,
          shipment_group_id,
          created_at,
          created_by,
          assignee_user_id,
          containers (
            id,
            container_number,
            tracking_requests (
              id,
              container_id,
              container_number,
              normalized_number,
              status,
              last_sync_at,
              created_at,
              error_message,
              source_bill_of_lading
            )
          )
        `,
    )
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (qErr) return { ok: false, error: qErr.message };
  if (!data) return { ok: false, error: "Shipment not found in this organization." };

  const raw = data as {
    id: string;
    organization_id: string;
    reference: string;
    bill_of_lading: string | null;
    shipping_line: string | null;
    shipment_group_id: string | null;
    created_at: string;
    created_by: string | null;
    assignee_user_id: string | null;
    containers?: Array<{
      id: string;
      container_number: string;
      tracking_requests?: ShipmentOverviewTrackingRow | ShipmentOverviewTrackingRow[] | null;
    }> | null;
  };
  const lines: ShipmentOverviewTrackingRow[] = [];
  for (const c of raw.containers ?? []) {
    const trs = c.tracking_requests;
    if (Array.isArray(trs)) lines.push(...trs);
    else if (trs) lines.push(trs);
  }

  return {
    ok: true,
    row: {
      id: raw.id,
      organization_id: raw.organization_id,
      reference: raw.reference,
      bill_of_lading: raw.bill_of_lading,
      shipping_line: raw.shipping_line,
      shipment_group_id: raw.shipment_group_id,
      created_at: raw.created_at,
      owner_user_id: raw.created_by,
      assignee_user_id: raw.assignee_user_id ?? null,
      tracking_requests: lines,
    },
  };
}
