import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { insertExternalApiLog } from "@models/external_api_logs";

export async function logExternalCall(
  admin: SupabaseClient | null,
  row: {
    organization_id?: string | null;
    function_name: string;
    endpoint?: string | null;
    request_payload?: unknown;
    response_status: number;
    response_body?: unknown;
    duration_ms: number;
  },
): Promise<void> {
  if (!admin) return;
  try {
    await insertExternalApiLog(admin, {
      organization_id: row.organization_id ?? null,
      function_name: row.function_name,
      endpoint: row.endpoint ?? null,
      request_payload: row.request_payload ?? null,
      response_status: row.response_status,
      response_body: row.response_body ?? null,
      duration_ms: row.duration_ms,
    });
  } catch {
    // avoid failing user requests if observability insert fails
  }
}
