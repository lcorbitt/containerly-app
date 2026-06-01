import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { ShipmentLineInput } from "@shared/dto/logistics.dto.ts";

export type ShipmentLineRow = {
  id: string;
  shipment_id: string;
  organization_id: string;
  container_id: string | null;
  container_number: string | null;
  order_number: string | null;
  carrier_booking_number: string | null;
  customer_name: string | null;
  country: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  freight_booking_carrier: string | null;
  vessel: string | null;
  voyage: string | null;
  health_certificate_no: string | null;
  trade_terms: string | null;
  sort_order: number;
};

function lineToInsert(shipmentId: string, line: ShipmentLineInput, sortOrder: number) {
  return {
    shipment_id: shipmentId,
    container_id: line.container_id ?? null,
    container_number: line.container_number?.trim() || null,
    order_number: line.order_number?.trim() || null,
    carrier_booking_number: line.carrier_booking_number?.trim() || null,
    customer_name: line.customer_name?.trim() || null,
    country: line.country?.trim() || null,
    port_of_loading: line.port_of_loading?.trim() || null,
    port_of_destination: line.port_of_destination?.trim() || null,
    estimated_departure_at: line.estimated_departure_at ?? null,
    estimated_arrival_at: line.estimated_arrival_at ?? null,
    freight_booking_carrier: line.freight_booking_carrier?.trim() || null,
    vessel: line.vessel?.trim() || null,
    voyage: line.voyage?.trim() || null,
    health_certificate_no: line.health_certificate_no?.trim() || null,
    trade_terms: line.trade_terms?.trim() || null,
    sort_order: line.sort_order ?? sortOrder,
  };
}

export async function listShipmentLinesForShipment(client: SupabaseClient, shipmentId: string) {
  return client
    .from("shipment_lines")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("sort_order", { ascending: true });
}

export async function insertShipmentLines(
  client: SupabaseClient,
  shipmentId: string,
  lines: ShipmentLineInput[],
) {
  const rows = lines.map((line, i) => lineToInsert(shipmentId, line, i));
  return client.from("shipment_lines").insert(rows).select("id");
}

export async function replaceShipmentLines(
  client: SupabaseClient,
  shipmentId: string,
  lines: ShipmentLineInput[],
) {
  const del = await client.from("shipment_lines").delete().eq("shipment_id", shipmentId);
  if (del.error) return del;
  if (lines.length === 0) return { data: [], error: null };
  return insertShipmentLines(client, shipmentId, lines);
}

export async function deleteShipmentLinesExcept(
  client: SupabaseClient,
  shipmentId: string,
  keepIds: string[],
) {
  let q = client.from("shipment_lines").delete().eq("shipment_id", shipmentId);
  if (keepIds.length > 0) {
    q = q.not("id", "in", `(${keepIds.join(",")})`);
  }
  return q;
}

export async function upsertShipmentLines(
  client: SupabaseClient,
  shipmentId: string,
  lines: ShipmentLineInput[],
) {
  const existing = await listShipmentLinesForShipment(client, shipmentId);
  if (existing.error) return { data: null, error: existing.error };

  const existingIds = new Set((existing.data ?? []).map((r) => r.id as string));
  const incomingIds = lines.filter((l) => l.id).map((l) => l.id as string);
  const toDelete = [...existingIds].filter((id) => !incomingIds.includes(id));

  if (toDelete.length > 0) {
    const { error } = await client.from("shipment_lines").delete().in("id", toDelete);
    if (error) return { data: null, error };
  }

  const resultIds: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const row = lineToInsert(shipmentId, line, i);
    if (line.id && existingIds.has(line.id)) {
      const { data, error } = await client
        .from("shipment_lines")
        .update(row)
        .eq("id", line.id)
        .select("id")
        .single();
      if (error) return { data: null, error };
      resultIds.push(data.id as string);
    } else {
      const { data, error } = await client
        .from("shipment_lines")
        .insert(row)
        .select("id")
        .single();
      if (error) return { data: null, error };
      resultIds.push(data.id as string);
    }
  }

  return { data: resultIds, error: null };
}
