import { jsonResponse } from "@supabase-shared/utils.ts";

/** Legacy anonymous endpoint — disabled. */
export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }
  return jsonResponse(
    {
      error:
        "Public report messaging is disabled. Sign in and open the shipment from your shared link to post messages.",
    },
    { status: 410 },
  );
}
