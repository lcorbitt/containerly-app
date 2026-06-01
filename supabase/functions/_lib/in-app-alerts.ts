/**
 * Cross-runtime in-app alert helpers (Next server + Supabase Edge).
 * Email delivery stays in `supabase/functions/_lib/notification-workflow.service.ts`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ShipmentAlertContext {
  organizationId: string;
  shipmentId: string;
  containerId?: string | null;
}

async function insertAlert(client: SupabaseClient, row: Record<string, unknown>) {
  return client.from("alerts").insert(row);
}

export async function listOrgAdminUserIds(
  client: SupabaseClient,
  organizationId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "admin");
  if (error) throw error;
  return (data ?? [])
    .map((r) => r.user_id as string | null)
    .filter((id): id is string => Boolean(id));
}

export async function shipmentStakeholderUserIds(
  client: SupabaseClient,
  shipmentId: string,
  opts?: { excludeUserId?: string | null },
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: ship } = await client
    .from("shipments")
    .select("assignee_user_id")
    .eq("id", shipmentId)
    .maybeSingle();
  if (ship?.assignee_user_id) ids.add(ship.assignee_user_id as string);

  const { data: participants } = await client
    .from("shipment_participants")
    .select("user_id")
    .eq("shipment_id", shipmentId);
  for (const p of participants ?? []) {
    if (p.user_id) ids.add(p.user_id as string);
  }

  if (opts?.excludeUserId) ids.delete(opts.excludeUserId);
  return [...ids];
}

export async function fetchProfileDisplayName(
  client: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await client
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const full = (data?.full_name as string | null | undefined)?.trim();
  if (full) return full;
  const email = (data?.email as string | null | undefined)?.trim();
  if (email) return email.split("@")[0] ?? email;
  return "Someone";
}

export async function fetchShipmentOrderLabel(
  client: SupabaseClient,
  shipmentId: string,
): Promise<string> {
  const { data } = await client
    .from("shipments")
    .select("order_number, container_number")
    .eq("id", shipmentId)
    .maybeSingle();
  const order = (data?.order_number as string | null | undefined)?.trim();
  if (order) return order;
  const container = (data?.container_number as string | null | undefined)?.trim();
  return container || "shipment";
}

async function insertAlertsForRecipients(
  client: SupabaseClient,
  recipientIds: string[],
  row: Omit<Record<string, unknown>, "recipient_user_id">,
): Promise<void> {
  for (const userId of recipientIds) {
    await insertAlert(client, { ...row, recipient_user_id: userId });
  }
}

export async function notifyOrgAdminsMemberJoined(
  client: SupabaseClient,
  args: {
    organizationId: string;
    newMemberUserId: string;
    actorUserId: string;
    memberDisplayName: string;
    invited: boolean;
  },
): Promise<void> {
  const adminIds = await listOrgAdminUserIds(client, args.organizationId);
  const recipients = adminIds.filter(
    (id) => id !== args.newMemberUserId && id !== args.actorUserId,
  );
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const message = args.invited
    ? `${args.memberDisplayName} was invited and added to your organization.`
    : `${args.memberDisplayName} joined your organization.`;

  await insertAlertsForRecipients(client, recipients, {
    organization_id: args.organizationId,
    shipment_id: null,
    container_id: null,
    alert_type: "ORG_MEMBER_JOINED",
    severity: "info",
    message,
    actor_user_id: args.actorUserId,
    details: { member_user_id: args.newMemberUserId, invited: args.invited, actor_name: actorName },
  });
}

export async function notifyUserAssignedAsAssignee(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    assigneeUserId: string;
    actorUserId: string;
  },
): Promise<void> {
  if (args.assigneeUserId === args.actorUserId) return;
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  await insertAlert(client, {
    organization_id: args.organizationId,
    shipment_id: args.shipmentId,
    container_id: args.containerId ?? null,
    alert_type: "ASSIGNMENT_ASSIGNEE",
    severity: "info",
    message: `${actorName} made you the assignee of shipment ${label}.`,
    recipient_user_id: args.assigneeUserId,
    actor_user_id: args.actorUserId,
  });
}

export async function notifyUserUnassignedAsAssignee(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    previousAssigneeUserId: string;
    actorUserId: string;
    newAssigneeUserId?: string | null;
  },
): Promise<void> {
  if (args.previousAssigneeUserId === args.actorUserId) return;
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  const message = args.newAssigneeUserId
    ? `${actorName} reassigned shipment ${label} to someone else.`
    : `${actorName} removed you as assignee of shipment ${label}.`;
  await insertAlert(client, {
    organization_id: args.organizationId,
    shipment_id: args.shipmentId,
    container_id: args.containerId ?? null,
    alert_type: args.newAssigneeUserId ? "ASSIGNMENT_REASSIGNED" : "ASSIGNMENT_REMOVED",
    severity: "info",
    message,
    recipient_user_id: args.previousAssigneeUserId,
    actor_user_id: args.actorUserId,
  });
}

export async function notifyUserAssignedAsParticipant(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    participantUserId: string;
    actorUserId: string;
  },
): Promise<void> {
  if (args.participantUserId === args.actorUserId) return;
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  await insertAlert(client, {
    organization_id: args.organizationId,
    shipment_id: args.shipmentId,
    container_id: args.containerId ?? null,
    alert_type: "ASSIGNMENT_PARTICIPANT",
    severity: "info",
    message: `${actorName} added you as a participant on shipment ${label}.`,
    recipient_user_id: args.participantUserId,
    actor_user_id: args.actorUserId,
  });
}

export async function notifyUserRemovedAsParticipant(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    participantUserId: string;
    actorUserId: string;
  },
): Promise<void> {
  if (args.participantUserId === args.actorUserId) return;
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  await insertAlert(client, {
    organization_id: args.organizationId,
    shipment_id: args.shipmentId,
    container_id: args.containerId ?? null,
    alert_type: "ASSIGNMENT_REMOVED",
    severity: "info",
    message: `${actorName} removed you as a participant on shipment ${label}.`,
    recipient_user_id: args.participantUserId,
    actor_user_id: args.actorUserId,
  });
}

export async function notifyShipmentStakeholdersInApp(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    alertType: string;
    severity: string;
    message: string;
    excludeUserId?: string | null;
    actorUserId?: string | null;
    details?: Record<string, unknown> | null;
  },
): Promise<string[]> {
  const recipients = await shipmentStakeholderUserIds(client, args.shipmentId, {
    excludeUserId: args.excludeUserId,
  });
  await insertAlertsForRecipients(client, recipients, {
    organization_id: args.organizationId,
    shipment_id: args.shipmentId,
    container_id: args.containerId ?? null,
    alert_type: args.alertType,
    severity: args.severity,
    message: args.message,
    actor_user_id: args.actorUserId ?? null,
    details: args.details ?? null,
  });
  return recipients;
}

export async function notifyOperatorsCustomerAccessGranted(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    customerDisplayName: string;
    actorUserId?: string | null;
  },
): Promise<void> {
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "CUSTOMER_ACCESS_GRANTED",
    severity: "info",
    message: `${args.customerDisplayName} joined the customer portal for this shipment.`,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
  });
}

export async function notifyOperatorsCustomerDocumentUploaded(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    fileName: string;
    customerUserId: string;
  },
): Promise<void> {
  const name = await fetchProfileDisplayName(client, args.customerUserId);
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "DOCUMENT_UPLOADED",
    severity: "info",
    message: `${name} uploaded a document: ${args.fileName}`,
    excludeUserId: args.customerUserId,
    actorUserId: args.customerUserId,
  });
}

export async function notifyOperatorsDraftsPublished(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    actorUserId: string;
    fileCount: number;
  },
): Promise<void> {
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  const message =
    args.fileCount === 1
      ? `${actorName} published draft documents on ${label} for customer review.`
      : `${actorName} published ${args.fileCount} draft documents on ${label} for customer review.`;
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "DRAFTS_PUBLISHED",
    severity: "info",
    message,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
  });
}

export async function notifyOperatorsOriginalsMailed(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    actorUserId: string;
    trackingNumber: string | null;
  },
): Promise<void> {
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const trackingPart = args.trackingNumber?.trim()
    ? ` — tracking: ${args.trackingNumber.trim()}`
    : "";
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "DOCUMENTS_MAILED",
    severity: "info",
    message: `${actorName} marked original documents as mailed${trackingPart}.`,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
  });
}

export async function notifyOperatorsTeamMessage(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    actorUserId: string;
    preview: string;
  },
): Promise<void> {
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "MESSAGE_TEAM",
    severity: "info",
    message: `${actorName} on ${label}: ${args.preview.slice(0, 160)}`,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
  });
}

export async function notifyCustomersOperatorReply(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    operatorUserId: string;
    preview: string;
  },
): Promise<void> {
  const { data: rows } = await client
    .from("shipment_customer_access")
    .select("customer_user_id")
    .eq("shipment_id", args.shipmentId)
    .is("revoked_at", null);
  const customerIds = (rows ?? [])
    .map((r) => r.customer_user_id as string | null)
    .filter((id): id is string => Boolean(id));

  for (const customerUserId of customerIds) {
    await insertAlert(client, {
      organization_id: args.organizationId,
      shipment_id: args.shipmentId,
      container_id: args.containerId ?? null,
      alert_type: "MESSAGE_REPLY",
      severity: "info",
      message: args.preview.slice(0, 200),
      recipient_user_id: customerUserId,
      actor_user_id: args.operatorUserId,
    });
  }
}

export async function notifyOperatorsOperatorRepliedToCustomer(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    actorUserId: string;
    preview: string;
  },
): Promise<void> {
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "MESSAGE_REPLY",
    severity: "info",
    message: `${actorName} replied to the customer on ${label}: ${args.preview.slice(0, 120)}`,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
  });
}

export async function notifyOperatorsTrackingLinked(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    actorUserId: string;
    containerNumber: string;
  },
): Promise<void> {
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const label = await fetchShipmentOrderLabel(client, args.shipmentId);
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "TRACKING_LINKED",
    severity: "info",
    message: `${actorName} linked carrier tracking ${args.containerNumber} to ${label}.`,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
    details: { container_number: args.containerNumber },
  });
}

export async function notifyOperatorsBolImported(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    actorUserId: string;
    billOfLading: string;
    containerCount: number;
  },
): Promise<void> {
  const actorName = await fetchProfileDisplayName(client, args.actorUserId);
  const message =
    args.containerCount === 1
      ? `${actorName} imported BOL ${args.billOfLading} (1 container).`
      : `${actorName} imported BOL ${args.billOfLading} (${args.containerCount} containers).`;
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "BOL_IMPORTED",
    severity: "info",
    message,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
    details: { bill_of_lading: args.billOfLading, container_count: args.containerCount },
  });
}

export async function notifyOperatorsTrackingSyncFailed(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    containerNumber: string;
    errorMessage: string;
  },
): Promise<void> {
  await notifyShipmentStakeholdersInApp(client, {
    ...args,
    alertType: "TRACKING_SYNC_FAILED",
    severity: "warning",
    message: `Tracking sync failed for ${args.containerNumber}: ${args.errorMessage.slice(0, 120)}`,
    details: { container_number: args.containerNumber, error: args.errorMessage },
  });
}

export async function notifyShipmentStakeholdersCarrierAlert(
  client: SupabaseClient,
  args: ShipmentAlertContext & {
    alertType: "SHIPMENT_DELAYED" | "STATUS_EXCEPTION";
    severity: string;
    message: string;
    details?: Record<string, unknown> | null;
    trackingRequestId?: string | null;
  },
): Promise<void> {
  await insertAlertsForRecipients(
    client,
    await shipmentStakeholderUserIds(client, args.shipmentId),
    {
      organization_id: args.organizationId,
      shipment_id: args.shipmentId,
      container_id: args.containerId ?? null,
      tracking_request_id: args.trackingRequestId ?? null,
      alert_type: args.alertType,
      severity: args.severity,
      message: args.message,
      details: args.details ?? null,
    },
  );
}
