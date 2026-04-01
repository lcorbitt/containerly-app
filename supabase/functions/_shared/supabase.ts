import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createUserClient(req: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!url || !anon || !authHeader) {
    throw new Error("Missing Supabase env or Authorization header");
  }
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
}

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
}
