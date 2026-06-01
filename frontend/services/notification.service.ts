import { apiJson } from "@/utils/api-client";

export async function notifyBolImported(input: {
  organizationId: string;
  shipmentId: string;
  billOfLading: string;
  containerCount: number;
}): Promise<void> {
  await apiJson<{ ok: true }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/notifications/bol-import`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: input.shipmentId,
        bill_of_lading: input.billOfLading,
        container_count: input.containerCount,
      }),
    },
  );
}
