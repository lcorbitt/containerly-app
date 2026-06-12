import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch } from "@/lib/supabase/edge-functions";

async function parseEdgeJson<T>(result: { res: Response; text: string }): Promise<T> {
  if (!result.res.ok) {
    let message = result.res.statusText;
    try {
      const parsed = JSON.parse(result.text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      if (result.text) message = result.text;
    }
    throw new Error(message);
  }
  return JSON.parse(result.text) as T;
}

export async function notifyBolImported(input: {
  organizationId: string;
  shipmentId: string;
  billOfLading: string;
  containerCount: number;
}): Promise<void> {
  const result = await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.workspace.notifyBolImport, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: input.organizationId,
      shipment_id: input.shipmentId,
      bill_of_lading: input.billOfLading,
      container_count: input.containerCount,
    }),
  });
  if ("error" in result) throw new Error(result.error);
  await parseEdgeJson<{ ok: true }>(result);
}
