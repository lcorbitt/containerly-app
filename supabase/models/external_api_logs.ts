import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ExternalApiLogInsert = {
  organization_id?: string | null;
  function_name: string;
  endpoint?: string | null;
  request_payload?: unknown;
  response_status: number;
  response_body?: unknown;
  duration_ms: number;
};

/** Insert a row into `external_api_logs` (observability / audit). */
export async function insertExternalApiLog(
  client: SupabaseClient,
  row: ExternalApiLogInsert,
): Promise<void> {
  await client.from("external_api_logs").insert({
    organization_id: row.organization_id ?? null,
    function_name: row.function_name,
    endpoint: row.endpoint ?? null,
    request_payload: row.request_payload ?? null,
    response_status: row.response_status,
    response_body: row.response_body ?? null,
    duration_ms: row.duration_ms,
  });
}
