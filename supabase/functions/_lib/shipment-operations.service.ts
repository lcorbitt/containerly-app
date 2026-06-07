import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  fetchMembershipRoleForOrg,
  fetchMembershipUserIdForOrg,
} from "@models/organization_members.ts";
import { fetchProfileRole } from "@models/profiles.ts";
import { insertShipmentActivityEvent } from "@models/shipment_activity_events.ts";
import {
  deleteShipmentInOrganization,
  fetchShipmentInOrganization,
  insertShipment,
  updateShipmentCommercial,
} from "@models/shipments.ts";
import { insertShipmentLines, upsertShipmentLines } from "@models/shipment_lines.ts";
import { recordShipmentCreated } from "@supabase-shared/document-workflow.service.ts";
import type {
  CreateShipmentBody,
  CreateShipmentResponse,
  DeleteShipmentBody,
  ShipmentCommercialHeader,
  ShipmentRiskLevel,
  UpdateShipmentBody,
  UpdateShipmentRiskBody,
  UpdateShipmentRiskResponse,
  UpdateShipmentResponse,
} from "@shared/dto/logistics.dto.ts";

type Err = { ok: false; status: number; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function headerToShipmentRow(header: ShipmentCommercialHeader, userId: string) {
  return {
    order_number: header.order_number.trim(),
    carrier_booking_number: header.carrier_booking_number.trim(),
    container_number: header.container_number.trim(),
    customer_name: header.customer_name?.trim() || null,
    consignee: header.consignee?.trim() || null,
    country: header.country?.trim() || null,
    port_of_loading: header.port_of_loading?.trim() || null,
    port_of_destination: header.port_of_destination?.trim() || null,
    estimated_departure_at: header.estimated_departure_at ?? null,
    estimated_arrival_at: header.estimated_arrival_at ?? null,
    freight_booking_carrier: header.freight_booking_carrier?.trim() || null,
    vessel: header.vessel?.trim() || null,
    voyage: header.voyage?.trim() || null,
    health_certificate_no: header.health_certificate_no?.trim() || null,
    trade_terms: header.trade_terms?.trim() || null,
    bill_of_lading: header.bill_of_lading?.trim() || null,
    shipping_line: header.shipping_line?.trim() || null,
    created_by: userId,
    assignee_user_id: userId,
    workflow_status: "pending_drafts" as const,
  };
}

export async function createCommercialShipment(
  userClient: SupabaseClient,
  userId: string,
  input: CreateShipmentBody,
): Promise<{ ok: true } & CreateShipmentResponse | Err> {
  const orgId = input.organization_id?.trim();
  if (!orgId || !UUID_RE.test(orgId)) {
    return { ok: false, status: 400, error: "Invalid organization_id" };
  }
  if (!input.header?.order_number?.trim()) {
    return { ok: false, status: 400, error: "header.order_number required" };
  }
  if (!input.header?.carrier_booking_number?.trim()) {
    return { ok: false, status: 400, error: "header.carrier_booking_number required" };
  }
  if (!input.header?.container_number?.trim()) {
    return { ok: false, status: 400, error: "header.container_number required" };
  }
  if (!input.lines?.length) {
    return { ok: false, status: 400, error: "At least one shipment line required" };
  }

  const { data: membership, error: memErr } = await fetchMembershipUserIdForOrg(
    userClient,
    orgId,
    userId,
  );
  if (memErr) throw memErr;
  if (!membership) return { ok: false, status: 403, error: "Not a member of this organization" };

  const { data: ship, error: shipErr } = await insertShipment(
    userClient,
    {
      organization_id: orgId,
      ...headerToShipmentRow(input.header, userId),
    },
  );
  if (shipErr) return { ok: false, status: 500, error: shipErr.message };
  if (!ship?.id) return { ok: false, status: 500, error: "Could not create shipment" };

  const shipmentId = ship.id as string;
  const { data: lineRows, error: lineErr } = await insertShipmentLines(
    userClient,
    shipmentId,
    input.lines,
  );
  if (lineErr) return { ok: false, status: 500, error: lineErr.message };

  await recordShipmentCreated(userClient, shipmentId, userId, {
    order_number: input.header.order_number.trim(),
    customer_name: input.header.customer_name?.trim() || null,
    container_number: input.header.container_number.trim(),
    carrier_booking_number: input.header.carrier_booking_number.trim(),
    port_of_loading: input.header.port_of_loading?.trim() || null,
    port_of_destination: input.header.port_of_destination?.trim() || null,
    line_count: input.lines.length,
  });

  return {
    ok: true,
    shipment_id: shipmentId,
    line_ids: (lineRows ?? []).map((r) => r.id as string),
  };
}

export async function updateCommercialShipment(
  userClient: SupabaseClient,
  userId: string,
  input: UpdateShipmentBody,
): Promise<{ ok: true } & UpdateShipmentResponse | Err> {
  const orgId = input.organization_id?.trim();
  const shipmentId = input.shipment_id?.trim();
  if (!orgId || !UUID_RE.test(orgId)) {
    return { ok: false, status: 400, error: "Invalid organization_id" };
  }
  if (!shipmentId || !UUID_RE.test(shipmentId)) {
    return { ok: false, status: 400, error: "Invalid shipment_id" };
  }

  const { data: existing, error: exErr } = await fetchShipmentInOrganization(
    userClient,
    shipmentId,
    orgId,
  );
  if (exErr) throw exErr;
  if (!existing?.id) return { ok: false, status: 404, error: "Shipment not found" };

  const { data: membership, error: memErr } = await fetchMembershipUserIdForOrg(
    userClient,
    orgId,
    userId,
  );
  if (memErr) throw memErr;
  if (!membership) return { ok: false, status: 403, error: "Not a member of this organization" };

  const updateFields: Record<string, unknown> = {};
  if (input.header) {
    const h = input.header;
    if (h.order_number !== undefined) updateFields.order_number = h.order_number.trim();
    if (h.carrier_booking_number !== undefined) {
      updateFields.carrier_booking_number = h.carrier_booking_number.trim();
    }
    if (h.container_number !== undefined) updateFields.container_number = h.container_number.trim();
    if (h.customer_name !== undefined) updateFields.customer_name = h.customer_name?.trim() || null;
    if (h.consignee !== undefined) updateFields.consignee = h.consignee?.trim() || null;
    if (h.country !== undefined) updateFields.country = h.country?.trim() || null;
    if (h.port_of_loading !== undefined) {
      updateFields.port_of_loading = h.port_of_loading?.trim() || null;
    }
    if (h.port_of_destination !== undefined) {
      updateFields.port_of_destination = h.port_of_destination?.trim() || null;
    }
    if (h.estimated_departure_at !== undefined) {
      updateFields.estimated_departure_at = h.estimated_departure_at;
    }
    if (h.estimated_arrival_at !== undefined) {
      updateFields.estimated_arrival_at = h.estimated_arrival_at;
    }
    if (h.freight_booking_carrier !== undefined) {
      updateFields.freight_booking_carrier = h.freight_booking_carrier?.trim() || null;
    }
    if (h.vessel !== undefined) updateFields.vessel = h.vessel?.trim() || null;
    if (h.voyage !== undefined) updateFields.voyage = h.voyage?.trim() || null;
    if (h.health_certificate_no !== undefined) {
      updateFields.health_certificate_no = h.health_certificate_no?.trim() || null;
    }
    if (h.trade_terms !== undefined) updateFields.trade_terms = h.trade_terms?.trim() || null;
    if (h.bill_of_lading !== undefined) {
      updateFields.bill_of_lading = h.bill_of_lading?.trim() || null;
    }
    if (h.shipping_line !== undefined) updateFields.shipping_line = h.shipping_line?.trim() || null;
  }

  if (input.physical_mail_tracking_number !== undefined) {
    updateFields.physical_mail_tracking_number = input.physical_mail_tracking_number?.trim() || null;
    if (input.physical_mail_tracking_number?.trim()) {
      updateFields.physical_mail_sent_at = new Date().toISOString();
      updateFields.workflow_status = "originals_sent";
    }
  }

  if (input.workflow_status) {
    updateFields.workflow_status = input.workflow_status;
  }

  if (Object.keys(updateFields).length > 0) {
    const { error: upErr } = await updateShipmentCommercial(userClient, shipmentId, updateFields);
    if (upErr) return { ok: false, status: 500, error: upErr.message };
  }

  let lineIds: string[] = [];
  if (input.lines) {
    const { data: ids, error: lineErr } = await upsertShipmentLines(
      userClient,
      shipmentId,
      input.lines,
    );
    if (lineErr) return { ok: false, status: 500, error: lineErr.message };
    lineIds = ids ?? [];
  }

  return { ok: true, shipment_id: shipmentId, line_ids: lineIds };
}

const SHIPMENT_RISK_LEVELS = new Set<ShipmentRiskLevel>(["low", "medium", "high"]);

function formatRiskLevelLabel(level: ShipmentRiskLevel | null | undefined): string {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return "Carrier Default";
  }
}

export async function updateShipmentRisk(
  userClient: SupabaseClient,
  userId: string,
  input: UpdateShipmentRiskBody,
): Promise<{ ok: true } & UpdateShipmentRiskResponse | Err> {
  const orgId = input.organization_id?.trim();
  const shipmentId = input.shipment_id?.trim();
  if (!orgId || !UUID_RE.test(orgId)) {
    return { ok: false, status: 400, error: "Invalid organization_id" };
  }
  if (!shipmentId || !UUID_RE.test(shipmentId)) {
    return { ok: false, status: 400, error: "Invalid shipment_id" };
  }

  const { data: existing, error: exErr } = await fetchShipmentInOrganization(
    userClient,
    shipmentId,
    orgId,
  );
  if (exErr) throw exErr;
  if (!existing?.id) return { ok: false, status: 404, error: "Shipment not found" };

  const { data: membership, error: memErr } = await fetchMembershipUserIdForOrg(
    userClient,
    orgId,
    userId,
  );
  if (memErr) throw memErr;
  if (!membership) return { ok: false, status: 403, error: "Not a member of this organization" };

  const level = input.risk_level;
  if (level != null && !SHIPMENT_RISK_LEVELS.has(level)) {
    return { ok: false, status: 400, error: "Invalid risk_level" };
  }

  const message = String(input.risk_message ?? "").trim();
  if (!message) {
    return { ok: false, status: 400, error: "risk_message is required" };
  }

  const previousLevel = existing.risk_level as ShipmentRiskLevel | null | undefined;
  const riskLabel = formatRiskLevelLabel(level);

  const { error: upErr } = await updateShipmentCommercial(userClient, shipmentId, {
    risk_level: level,
    risk_message: message,
  });
  if (upErr) return { ok: false, status: 500, error: upErr.message };

  const { error: activityErr } = await insertShipmentActivityEvent(userClient, {
    shipment_id: shipmentId,
    event_type: "risk_status_updated",
    body: `Risk status updated to ${riskLabel}`,
    actor_kind: "operator",
    actor_user_id: userId,
    metadata: {
      risk_level: level,
      risk_message: message,
      previous_risk_level: previousLevel ?? null,
    },
  });
  if (activityErr) return { ok: false, status: 500, error: activityErr.message };

  return { ok: true, shipment_id: shipmentId };
}

export async function deleteCommercialShipment(
  userClient: SupabaseClient,
  userId: string,
  input: DeleteShipmentBody,
): Promise<{ ok: true; shipment_id: string } | Err> {
  const orgId = input.organization_id?.trim();
  const shipmentId = input.shipment_id?.trim();
  if (!orgId || !UUID_RE.test(orgId)) {
    return { ok: false, status: 400, error: "Invalid organization_id" };
  }
  if (!shipmentId || !UUID_RE.test(shipmentId)) {
    return { ok: false, status: 400, error: "Invalid shipment_id" };
  }

  const { data: existing, error: exErr } = await fetchShipmentInOrganization(
    userClient,
    shipmentId,
    orgId,
  );
  if (exErr) throw exErr;
  if (!existing?.id) return { ok: false, status: 404, error: "Shipment not found" };

  const { data: profile, error: profileErr } = await fetchProfileRole(userClient, userId);
  if (profileErr) throw profileErr;
  const isSuperadmin = (profile?.role as string | undefined) === "superadmin";

  if (!isSuperadmin) {
    const { data: membership, error: memErr } = await fetchMembershipRoleForOrg(
      userClient,
      orgId,
      userId,
    );
    if (memErr) throw memErr;
    if (membership?.role !== "admin") {
      return { ok: false, status: 403, error: "Only organization admins can delete shipments" };
    }
  }

  const { error: delErr } = await deleteShipmentInOrganization(userClient, shipmentId, orgId);
  if (delErr) return { ok: false, status: 500, error: delErr.message };

  return { ok: true, shipment_id: shipmentId };
}
