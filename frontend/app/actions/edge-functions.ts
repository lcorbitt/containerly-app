"use server";

import { callEdgeFunctionServer } from "@/lib/supabase/call-edge-function-server";

export async function createTrackingRequestAction(args: {
  organization_id: string;
  container_number: string;
  run_sync?: boolean;
  shipment_group_id?: string | null;
  source_bill_of_lading?: string | null;
  /** JSONCargo carrier enum (MAERSK, MSC, …); stored on shipment and used for container sync. */
  shipping_line?: string | null;
  /** Same-org shipment to attach this line to (omit for a new shipment). Ignored when shipment_group_id is set. */
  shipment_id?: string | null;
  /** Title for a newly created shipment; defaults to container number. */
  shipment_reference?: string | null;
}) {
  const raw = (await callEdgeFunctionServer("create-tracking-request", {
    body: {
      organization_id: args.organization_id,
      container_number: args.container_number,
      run_sync: args.run_sync !== false,
      ...(args.shipment_group_id != null && args.shipment_group_id !== ""
        ? { shipment_group_id: args.shipment_group_id }
        : {}),
      ...(args.source_bill_of_lading?.trim()
        ? { source_bill_of_lading: args.source_bill_of_lading.trim() }
        : {}),
      ...(args.shipping_line?.trim() ? { shipping_line: args.shipping_line.trim() } : {}),
      ...(args.shipment_id != null && args.shipment_id !== ""
        ? { shipment_id: args.shipment_id.trim() }
        : {}),
      ...(args.shipment_reference?.trim()
        ? { shipment_reference: args.shipment_reference.trim() }
        : {}),
    },
  })) as { sync_error?: string };
  if (raw?.sync_error) {
    throw new Error(raw.sync_error);
  }
  return raw;
}

export async function syncContainerAction(args: {
  organization_id: string;
  container_number: string;
  tracking_request_id?: string;
  force?: boolean;
}) {
  return callEdgeFunctionServer("sync-container", { body: args });
}
