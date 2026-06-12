import { jsonResponse } from "@services/utils.ts";

/** Legacy anonymous endpoint — disabled; customers use authenticated shipment access. */
export async function handle(req: Request): Promise<Response> {
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
}
