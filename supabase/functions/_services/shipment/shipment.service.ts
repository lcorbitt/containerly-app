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
import { recordShipmentCreated } from "@services/shipment/document.service.ts";
import { notifyForShipmentActivityEvent } from "@services/shipment/activity/notifications.service.ts";
import { recordShipmentEdited } from "@services/shipment/activity/edit.service.ts";
import {
  buildCommercialEditChanges,
  isMailOrWorkflowOnlyUpdate,
} from "@services/shipment/activity/edit.utils.ts";
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
import { profileDisplayName } from "@shared/author-display-name.ts";
import { normalizeShipmentTagList } from "@shared/shipment-tags.ts";
import {
  buildShipmentContextSummary,
  buildShipmentInsightCards,
  computeShipmentMetrics,
} from "@services/shipment/metrics.ts";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto.ts";
import type {
  ShipmentContextSummary,
  ShipmentInsightCard,
  ShipmentMetricsSummary,
  ShipmentRootCause,
} from "@shared/dto/performance.dto.ts";
import type { ShipmentOverviewTrackingRow } from "@services/shipment/list.service.ts";
import {
  notifyUserAssignedAsAssignee,
  notifyUserAssignedAsParticipant,
  notifyUserRemovedAsParticipant,
  notifyUserUnassignedAsAssignee,
} from "@services/notification/in-app-alerts.ts";
import { createServiceClient } from "@services/db.ts";
import { isSuperadminRole } from "@shared/profile-role.ts";

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

export async function createShipment(
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

  await recordShipmentCreated(userClient, orgId, shipmentId, userId, {
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

export async function updateShipment(
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

  const commercialChanges = buildCommercialEditChanges(
    existing as Record<string, unknown>,
    updateFields,
  );
  const shouldRecordCommercialEdit =
    commercialChanges.length > 0 && !isMailOrWorkflowOnlyUpdate(updateFields);

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

  if (shouldRecordCommercialEdit) {
    try {
      await recordShipmentEdited(
        userClient,
        orgId,
        shipmentId,
        userId,
        commercialChanges,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not record shipment edit";
      return { ok: false, status: 500, error: message };
    }
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

  const riskMetadata = {
    risk_level: level,
    risk_message: message,
    previous_risk_level: previousLevel ?? null,
  };
  const { error: activityErr } = await insertShipmentActivityEvent(userClient, {
    shipment_id: shipmentId,
    event_type: "risk_status_updated",
    body: `Risk status updated to ${riskLabel}`,
    actor_kind: "operator",
    actor_user_id: userId,
    metadata: riskMetadata,
  });
  if (activityErr) return { ok: false, status: 500, error: activityErr.message };

  try {
    await notifyForShipmentActivityEvent({
      client: userClient,
      organizationId: orgId,
      shipmentId,
      actorUserId: userId,
      eventType: "risk_status_updated",
      metadata: riskMetadata,
    });
  } catch {
    /* best-effort */
  }

  return { ok: true, shipment_id: shipmentId };
}

export async function deleteShipment(
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

type DbRow = Record<string, unknown>;
type ShipmentParticipant = DbRow;
type ShipmentCustomerAccess = DbRow;
type CustomerInvite = DbRow;
type ShipmentCustomerAccessRequest = DbRow;

export async function runAssigneeChangeNotifications(input: {
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  previousAssigneeUserId: string | null;
  newAssigneeUserId: string | null;
}): Promise<void> {
  const admin = createServiceClient();
  const ctx = {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
  };

  if (
    input.previousAssigneeUserId &&
    input.previousAssigneeUserId !== input.newAssigneeUserId
  ) {
    await notifyUserUnassignedAsAssignee(admin, {
      ...ctx,
      previousAssigneeUserId: input.previousAssigneeUserId,
      actorUserId: input.actorUserId,
      newAssigneeUserId: input.newAssigneeUserId,
    });
  }

  if (input.newAssigneeUserId) {
    await notifyUserAssignedAsAssignee(admin, {
      ...ctx,
      assigneeUserId: input.newAssigneeUserId,
      actorUserId: input.actorUserId,
    });
  }
}

export async function runParticipantAddedNotification(input: {
  organizationId: string;
  shipmentId: string;
  participantUserId: string;
  actorUserId: string;
}): Promise<void> {
  const admin = createServiceClient();
  await notifyUserAssignedAsParticipant(admin, {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    participantUserId: input.participantUserId,
    actorUserId: input.actorUserId,
  });
}

export async function runParticipantRemovedNotification(input: {
  organizationId: string;
  shipmentId: string;
  participantUserId: string;
  actorUserId: string;
}): Promise<void> {
  const admin = createServiceClient();
  await notifyUserRemovedAsParticipant(admin, {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    participantUserId: input.participantUserId,
    actorUserId: input.actorUserId,
  });
}

/* ------------------------------------------------------------------ */
/*  Shipment access tab, workspace row, and mutation queries           */
/* ------------------------------------------------------------------ */

export type ShipmentAccessTabSnapshot = {
  assigneeUserId: string | null;
  participantRows: ShipmentParticipant[];
  orgPeers: { id: string; label: string }[];
  profileImagePathByUserId: Record<string, string | null>;
  customerAccessRows: ShipmentCustomerAccess[];
  pendingInvites: CustomerInvite[];
  pendingAccessRequests: ShipmentCustomerAccessRequest[];
  messageAuthorByUserId: Record<string, string>;
  customerEmailByUserId: Record<string, string>;
  tags: string[];
  orgTagSuggestions: string[];
  emailNotificationsSubscribed: boolean;
};

export async function fetchShipmentAccessTabSnapshot(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    currentUserId: string;
  },
): Promise<ShipmentAccessTabSnapshot> {
  const [
    { data: ship },
    { data: parts },
    { data: orgMemberRows },
    { data: accessRows },
    { data: invRows },
    { data: accessReqRows },
    { data: orgTagRows },
    { data: notificationSub },
  ] = await Promise.all([
    supabase
      .from("shipments")
      .select("assignee_user_id, tags")
      .eq("id", input.shipmentId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    supabase
      .from("shipment_participants")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .order("created_at", { ascending: true }),
    supabase.from("organization_members").select("user_id").eq("organization_id", input.organizationId),
    supabase
      .from("shipment_customer_access")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_invites")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("shipment_customer_access_requests")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false }),
    supabase.from("shipments").select("tags").eq("organization_id", input.organizationId),
    supabase
      .from("shipment_notification_subscriptions")
      .select("id")
      .eq("shipment_id", input.shipmentId)
      .eq("user_id", input.currentUserId)
      .maybeSingle(),
  ]);

  const assigneeUserId = (ship?.assignee_user_id as string | null) ?? null;
  const tags = normalizeShipmentTagList(((ship?.tags as string[] | null) ?? []) as string[]);
  const participantRows = (parts as ShipmentParticipant[]) ?? [];
  const customerAccessRows = (accessRows as ShipmentCustomerAccess[]) ?? [];
  const pendingInvites = (invRows as CustomerInvite[]) ?? [];
  const pendingAccessRequests = (accessReqRows as ShipmentCustomerAccessRequest[]) ?? [];

  const orgTagSuggestionSet = new Set<string>();
  for (const row of orgTagRows ?? []) {
    for (const tag of (row.tags as string[] | null) ?? []) {
      const normalized = normalizeShipmentTagList([tag])[0];
      if (normalized) orgTagSuggestionSet.add(normalized);
    }
  }
  const orgTagSuggestions = [...orgTagSuggestionSet].sort((a, b) => a.localeCompare(b));
  const emailNotificationsSubscribed = Boolean(notificationSub?.id);

  const imagePathByUser: Record<string, string | null> = {};
  const orgUserIds = [...new Set((orgMemberRows ?? []).map((m) => m.user_id as string))];
  let orgPeers: { id: string; label: string }[] = [];

  if (orgUserIds.length > 0) {
    const { data: peerProfs } = await supabase
      .from("profiles")
      .select("id, email, full_name, profile_image_path")
      .in("id", orgUserIds);
    orgPeers =
      (peerProfs ?? []).map((p) => ({
        id: p.id as string,
        label: profileDisplayName({
          full_name: p.full_name as string | null,
          email: p.email as string | null,
        }),
      })) ?? [];
    orgPeers.sort((a, b) => a.label.localeCompare(b.label));
    for (const p of peerProfs ?? []) {
      const uid = p.id as string;
      const path = p.profile_image_path as string | null | undefined;
      imagePathByUser[uid] = path?.trim() ? path : null;
    }
  }

  const customerIds = customerAccessRows.map((a) => a.customer_user_id);
  const participantIds = participantRows.map((p) => p.user_id);
  const profileIds = [...new Set([...customerIds, ...participantIds, ...(assigneeUserId ? [assigneeUserId] : [])])];
  const messageAuthorByUserId: Record<string, string> = {};
  const customerEmailByUserId: Record<string, string> = {};
  const customerUserIdSet = new Set(customerIds);
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", profileIds);
    for (const p of profs ?? []) {
      const userId = p.id as string;
      const email = (p.email as string | null)?.trim();
      messageAuthorByUserId[userId] = profileDisplayName({
        full_name: p.full_name as string | null,
        email,
      });
      if (customerUserIdSet.has(userId) && email) {
        customerEmailByUserId[userId] = email;
      }
    }
  }

  return {
    assigneeUserId,
    participantRows,
    orgPeers,
    profileImagePathByUserId: imagePathByUser,
    customerAccessRows,
    pendingInvites,
    pendingAccessRequests,
    messageAuthorByUserId,
    customerEmailByUserId,
    tags,
    orgTagSuggestions,
    emailNotificationsSubscribed,
  };
}
export async function updateShipmentNotificationSubscriptionQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    userId: string;
    subscribed: boolean;
  },
): Promise<boolean> {
  if (input.subscribed) {
    const { error } = await supabase.from("shipment_notification_subscriptions").insert({
      organization_id: input.organizationId,
      shipment_id: input.shipmentId,
      user_id: input.userId,
    });
    if (error && error.code !== "23505") throw new Error(error.message);
    return true;
  }

  const { error } = await supabase
    .from("shipment_notification_subscriptions")
    .delete()
    .eq("shipment_id", input.shipmentId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
  return false;
}
export async function updateShipmentTagsQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    tags: string[];
  },
): Promise<string[]> {
  const normalized = normalizeShipmentTagList(input.tags);
  const { error } = await supabase
    .from("shipments")
    .update({ tags: normalized })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
  return normalized;
}

export async function updateShipmentRootCauseQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    rootCause: ShipmentRootCause | null;
  },
): Promise<ShipmentRootCause | null> {
  const { error } = await supabase
    .from("shipments")
    .update({ root_cause: input.rootCause })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
  return input.rootCause;
}

export async function fetchShipmentAssigneeQuery(
  supabase: SupabaseClient,
  shipmentId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("shipments")
    .select("assignee_user_id")
    .eq("id", shipmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.assignee_user_id as string | null | undefined) ?? null;
}

export async function updateShipmentAssigneeQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    assigneeUserId: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("shipments")
    .update({ assignee_user_id: input.assigneeUserId })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
}

export async function fetchShipmentParticipantRowQuery(
  supabase: SupabaseClient,
  participantRowId: string,
): Promise<{ shipment_id: string; user_id: string } | null> {
  const { data, error } = await supabase
    .from("shipment_participants")
    .select("shipment_id, user_id")
    .eq("id", participantRowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.shipment_id || !data?.user_id) return null;
  return {
    shipment_id: data.shipment_id as string,
    user_id: data.user_id as string,
  };
}

export async function createShipmentParticipantQuery(
  supabase: SupabaseClient,
  input: { shipmentId: string; userId: string },
): Promise<void> {
  const { error } = await supabase.from("shipment_participants").insert({
    shipment_id: input.shipmentId,
    user_id: input.userId,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function deleteShipmentParticipantQuery(
  supabase: SupabaseClient,
  participantRowId: string,
): Promise<void> {
  const { error } = await supabase.from("shipment_participants").delete().eq("id", participantRowId);
  if (error) throw new Error(error.message);
}

export async function deleteShipmentForOrganizationQuery(
  supabase: SupabaseClient,
  input: { organizationId: string; shipmentId: string; userId: string },
): Promise<void> {
  const { data: existing, error: existingErr } = await supabase
    .from("shipments")
    .select("id")
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (existingErr) throw new Error(existingErr.message);
  if (!existing?.id) throw new Error("Shipment not found");

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", input.userId)
    .maybeSingle();
  if (profileErr) throw new Error(profileErr.message);

  if (!isSuperadminRole(profile?.role)) {
    const { data: membership, error: memErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", input.organizationId)
      .eq("user_id", input.userId)
      .maybeSingle();
    if (memErr) throw new Error(memErr.message);
    if (membership?.role !== "admin") {
      throw new Error("Only organization admins can delete shipments");
    }
  }

  const { error: delErr } = await supabase
    .from("shipments")
    .delete()
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (delErr) throw new Error(delErr.message);
}

export async function revokeCustomerInviteQuery(
  supabase: SupabaseClient,
  inviteId: string,
): Promise<void> {
  const { error } = await supabase.from("customer_invites").update({ status: "revoked" }).eq("id", inviteId);
  if (error) throw new Error(error.message);
}

export async function revokeShipmentCustomerAccessQuery(
  supabase: SupabaseClient,
  accessId: string,
): Promise<void> {
  const { error } = await supabase
    .from("shipment_customer_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Shipment Customer Access Settings                                  */
/* ------------------------------------------------------------------ */

export async function updateShipmentCustomerAccessSettingsQuery(
  supabase: SupabaseClient,
  input: {
    accessId: string;
    visibilitySettings: Record<string, boolean>;
    operatorOverrides: Record<string, string>;
  },
): Promise<void> {
  const { error } = await supabase
    .from("shipment_customer_access")
    .update({
      visibility_settings: input.visibilitySettings,
      operator_overrides: input.operatorOverrides,
    })
    .eq("id", input.accessId);
  if (error) throw new Error(error.message);
}
export type ShipmentWorkspaceRow = {
  id: string;
  organization_id: string;
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  owner_user_id: string | null;
  creator_display_name: string | null;
  assignee_user_id: string | null;
  customer_name: string | null;
  consignee: string | null;
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
  workflow_status: string | null;
  physical_mail_tracking_number: string | null;
  risk_level: string | null;
  risk_message: string | null;
  /** Primary container carrier-reported status (for default portal risk). */
  primary_carrier_status: string | null;
  tags: string[];
  root_cause: ShipmentRootCause | null;
  carrier_timeline: Record<string, unknown>[];
  metrics: ShipmentMetricsSummary;
  context: ShipmentContextSummary;
  insight_cards: ShipmentInsightCard[];
  tracking_requests: ShipmentOverviewTrackingRow[];
  activity_events: ShipmentActivityEvent[];
};

export async function fetchShipmentWorkspaceRow(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
  },
): Promise<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }> {
  const { data, error: qErr } = await supabase
    .from("shipments")
    .select(
      `
          id,
          organization_id,
          order_number,
          carrier_booking_number,
          container_number,
          bill_of_lading,
          shipping_line,
          shipment_group_id,
          created_at,
          created_by,
          assignee_user_id,
          customer_name,
          consignee,
          country,
          port_of_loading,
          port_of_destination,
          estimated_departure_at,
          estimated_arrival_at,
          freight_booking_carrier,
          vessel,
          voyage,
          health_certificate_no,
          trade_terms,
          workflow_status,
          physical_mail_tracking_number,
          risk_level,
          risk_message,
          tags,
          root_cause,
          containers (
            id,
            container_number,
            status,
            tracking_requests (
              id,
              container_id,
              container_number,
              normalized_number,
              status,
              last_sync_at,
              created_at,
              error_message,
              source_bill_of_lading
            )
          )
        `,
    )
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (qErr) return { ok: false, error: qErr.message };
  if (!data) return { ok: false, error: "Shipment not found in this organization." };

  const raw = data as {
    id: string;
    organization_id: string;
    order_number: string;
    carrier_booking_number: string;
    container_number: string;
    bill_of_lading: string | null;
    shipping_line: string | null;
    shipment_group_id: string | null;
    created_at: string;
    created_by: string | null;
    assignee_user_id: string | null;
  customer_name: string | null;
  consignee: string | null;
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
    workflow_status: string | null;
    physical_mail_tracking_number: string | null;
    risk_level: string | null;
    risk_message: string | null;
    tags?: string[] | null;
    root_cause?: string | null;
    containers?: Array<{
      id: string;
      container_number: string;
      status: string | null;
      tracking_requests?: ShipmentOverviewTrackingRow | ShipmentOverviewTrackingRow[] | null;
    }> | null;
  };
  const containers = raw.containers ?? [];
  const primaryCarrierStatus = containers[0]?.status ?? null;
  const containerIds = containers.map((c) => c.id);

  const lines: ShipmentOverviewTrackingRow[] = [];
  for (const c of containers) {
    const trs = c.tracking_requests;
    if (Array.isArray(trs)) lines.push(...trs);
    else if (trs) lines.push(trs);
  }

  const [
    creatorProfileResult,
    activityResult,
    trackingEventsResult,
    messagesResult,
    orgMessageStatsResult,
  ] = await Promise.all([
    raw.created_by
      ? supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", raw.created_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("shipment_activity_events")
      .select("id, event_type, body, actor_kind, occurred_at, metadata")
      .eq("shipment_id", input.shipmentId)
      .order("occurred_at", { ascending: true }),
    containerIds.length > 0
      ? supabase
          .from("tracking_events")
          .select(
            "id, event_type, status, location, occurred_at, created_at, container_id, tracking_request_id, raw_payload",
          )
          .in("container_id", containerIds)
          .order("occurred_at", { ascending: true })
          .limit(200)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    supabase
      .from("shipment_messages")
      .select("shipment_id, container_id, author_kind, created_at, is_internal, body")
      .eq("shipment_id", input.shipmentId)
      .is("container_id", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("shipment_messages")
      .select("shipment_id, container_id, author_kind, created_at, is_internal")
      .eq("organization_id", input.organizationId)
      .is("container_id", null)
      .eq("is_internal", false)
      .limit(5000),
  ]);

  if (activityResult.error) return { ok: false, error: activityResult.error.message };

  let creatorDisplayName: string | null = null;
  const creatorProfile = creatorProfileResult.data;
  if (creatorProfile) {
    creatorDisplayName = profileDisplayName({
      full_name: creatorProfile.full_name as string | null,
      email: creatorProfile.email as string | null,
    });
  }

  const carrierTimeline = ((trackingEventsResult.data ?? []) as Record<string, unknown>[]) ?? [];

  const shipmentMessages = (messagesResult.data ?? []) as Array<{
    shipment_id: string | null;
    container_id: string | null;
    author_kind: string;
    created_at: string;
    is_internal: boolean;
    body: string;
  }>;

  const metrics = computeShipmentMetrics({
    shipmentId: input.shipmentId,
    workflowStatus: raw.workflow_status,
    workflowStatusSince: raw.created_at,
    messages: shipmentMessages,
  });

  const orgMessages = (orgMessageStatsResult.data ?? []) as Array<{ shipment_id: string | null }>;
  const orgShipmentMessageCounts = new Map<string, number>();
  for (const msg of orgMessages) {
    const sid = msg.shipment_id;
    if (!sid) continue;
    orgShipmentMessageCounts.set(sid, (orgShipmentMessageCounts.get(sid) ?? 0) + 1);
  }
  const orgAvgMessages =
    orgShipmentMessageCounts.size > 0
      ? [...orgShipmentMessageCounts.values()].reduce((a, b) => a + b, 0) /
        orgShipmentMessageCounts.size
      : 0;

  const tags = normalizeShipmentTagList(raw.tags ?? []);
  const rootCause = (raw.root_cause as ShipmentRootCause | null) ?? null;

  const context = buildShipmentContextSummary({
    tags,
    risk_level: raw.risk_level,
    risk_message: raw.risk_message,
    triage_bucket_key: null,
    metrics,
  });

  const insightCards = buildShipmentInsightCards({
    metrics,
    orgAvgMessages,
    orgMedianResponseHours: null,
    triageBucketKey: null,
  });

  return {
    ok: true,
    row: {
      id: raw.id,
      organization_id: raw.organization_id,
      order_number: raw.order_number,
      carrier_booking_number: raw.carrier_booking_number,
      container_number: raw.container_number,
      bill_of_lading: raw.bill_of_lading,
      shipping_line: raw.shipping_line,
      shipment_group_id: raw.shipment_group_id,
      created_at: raw.created_at,
      owner_user_id: raw.created_by,
      creator_display_name: creatorDisplayName,
      assignee_user_id: raw.assignee_user_id ?? null,
      customer_name: raw.customer_name,
      consignee: raw.consignee,
      country: raw.country,
      port_of_loading: raw.port_of_loading,
      port_of_destination: raw.port_of_destination,
      estimated_departure_at: raw.estimated_departure_at,
      estimated_arrival_at: raw.estimated_arrival_at,
      freight_booking_carrier: raw.freight_booking_carrier,
      vessel: raw.vessel,
      voyage: raw.voyage,
      health_certificate_no: raw.health_certificate_no,
      trade_terms: raw.trade_terms,
      workflow_status: raw.workflow_status,
      physical_mail_tracking_number: raw.physical_mail_tracking_number,
      risk_level: raw.risk_level,
      risk_message: raw.risk_message,
      primary_carrier_status: primaryCarrierStatus,
      tags,
      root_cause: rootCause,
      carrier_timeline: carrierTimeline,
      metrics,
      context,
      insight_cards: insightCards,
      tracking_requests: lines,
      activity_events: (activityResult.data ?? []).map((row) => ({
        id: row.id as string,
        event_type: row.event_type as string,
        body: row.body as string,
        actor_kind: row.actor_kind as string,
        occurred_at: row.occurred_at as string,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
      })),
    },
  };
}
