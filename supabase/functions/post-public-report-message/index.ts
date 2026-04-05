import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

/** Legacy anonymous endpoint — disabled. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
});
