import type { ImporterGrantedShipmentRow, NestedContainer } from "@/services/shipment.service";
import { shipperReceiverFromLocation } from "@/utils/jsoncargo-display";

export function pickSingle<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function lastDataUpdateIso(row: ImporterGrantedShipmentRow): string | null {
  const c = pickSingle<NestedContainer>(row.containers ?? null);
  const sync = c?.last_synced_at ?? row.last_sync_at ?? null;
  const u = row.updated_at;
  if (sync && u) {
    return Date.parse(sync) >= Date.parse(u) ? sync : u;
  }
  return sync ?? u ?? null;
}

export function destinationLabel(cont: NestedContainer | null): string {
  if (!cont?.location || typeof cont.location !== "object") return "—";
  const loc = cont.location;
  const { receiver } = shipperReceiverFromLocation(loc);
  if (receiver?.trim()) return receiver.trim();
  const disc = loc.discharging_port;
  if (typeof disc === "string" && disc.trim()) return disc.trim();
  const next = loc.next_location;
  if (typeof next === "string" && next.trim()) return next.trim();
  return "—";
}
