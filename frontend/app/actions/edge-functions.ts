"use server";

import { callEdgeFunctionServer } from "@/lib/supabase/call-edge-function-server";

export async function createTrackingRequestAction(args: {
  organization_id: string;
  container_number: string;
  run_sync?: boolean;
}) {
  return callEdgeFunctionServer("create-tracking-request", {
    body: {
      organization_id: args.organization_id,
      container_number: args.container_number,
      run_sync: args.run_sync !== false,
    },
  });
}

export async function syncContainerAction(args: {
  organization_id: string;
  container_number: string;
  tracking_request_id?: string;
  force?: boolean;
}) {
  return callEdgeFunctionServer("sync-container", { body: args });
}
