import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

/** Legacy anonymous endpoint — disabled; customers use authenticated shipment access. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  return jsonResponse(
    {
      error:
        "Public report links are disabled. Sign in with your customer account and open the shipment from your invite.",
    },
    { status: 410 },
  );
});
