/**
 * Notification helpers: alerts + email for workflow events.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { insertAlert } from "@models/alerts.ts";
import { fetchProfileEmailByUserId } from "@models/profiles.ts";
import { listShipmentParticipantsUserIds } from "@models/shipment_participants.ts";
import { listShipmentNotificationSubscriberUserIds } from "@models/shipment_notification_subscriptions.ts";
import { fetchShipmentAssignee, fetchShipmentIdAndOrganization } from "@models/shipments.ts";
import {
  sendDocumentRejectedEmail,
  sendDocumentsApprovedEmail,
  sendDocumentsMailedEmail,
  sendNewMessageEmail,
} from "@supabase-shared/email.service.ts";

function siteUrl(): string {
  return Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "") ?? "";
}

async function operatorRecipientIds(
  client: SupabaseClient,
  shipmentId: string,
): Promise<string[]> {
  const ids = new Set<string>();
  const { data: assignee } = await fetchShipmentAssignee(client, shipmentId);
  if (assignee?.assignee_user_id) ids.add(assignee.assignee_user_id as string);

  const { data: participants } = await listShipmentParticipantsUserIds(client, shipmentId);
  for (const p of participants ?? []) {
    if (p.user_id) ids.add(p.user_id as string);
  }

  const { data: subscribers } = await listShipmentNotificationSubscriberUserIds(client, shipmentId);
  for (const s of subscribers ?? []) {
    if (s.user_id) ids.add(s.user_id as string);
  }

  return [...ids];
}

/** Email notifications: explicit shipment subscribers only. */
async function operatorEmailRecipientIds(
  client: SupabaseClient,
  shipmentId: string,
): Promise<string[]> {
  const { data: subscribers } = await listShipmentNotificationSubscriberUserIds(client, shipmentId);
  return (subscribers ?? [])
    .map((s) => s.user_id as string | null)
    .filter((id): id is string => Boolean(id));
}

export async function notifyOperatorsDocumentRejected(
  admin: SupabaseClient,
  args: {
    organizationId: string;
    shipmentId: string;
    containerId?: string | null;
    orgName: string;
    fileName: string;
    reason: string;
  },
): Promise<void> {
  const alertRecipients = await operatorRecipientIds(admin, args.shipmentId);
  const emailRecipients = await operatorEmailRecipientIds(admin, args.shipmentId);
  const workspaceUrl = `${siteUrl()}/shipments/${args.shipmentId}`;

  for (const userId of alertRecipients) {
    await insertAlert(admin, {
      organization_id: args.organizationId,
      shipment_id: args.shipmentId,
      container_id: args.containerId ?? null,
      alert_type: "DOCUMENT_REJECTED",
      severity: "critical",
      message: `Document rejected: ${args.fileName}`,
      recipient_user_id: userId,
    });
  }

  for (const userId of emailRecipients) {
    const { data: profile } = await fetchProfileEmailByUserId(admin, userId);
    if (profile?.email) {
      await sendDocumentRejectedEmail({
        to: profile.email as string,
        orgName: args.orgName,
        fileName: args.fileName,
        reason: args.reason,
        workspaceUrl,
      });
    }
  }
}

export async function notifyOperatorsDocumentsApproved(
  admin: SupabaseClient,
  args: {
    organizationId: string;
    shipmentId: string;
    orgName: string;
  },
): Promise<void> {
  const alertRecipients = await operatorRecipientIds(admin, args.shipmentId);
  const emailRecipients = await operatorEmailRecipientIds(admin, args.shipmentId);
  const workspaceUrl = `${siteUrl()}/shipments/${args.shipmentId}`;

  for (const userId of alertRecipients) {
    await insertAlert(admin, {
      organization_id: args.organizationId,
      shipment_id: args.shipmentId,
      alert_type: "DOCUMENTS_APPROVED",
      severity: "info",
      message: "All draft documents approved by customer",
      recipient_user_id: userId,
    });
  }

  for (const userId of emailRecipients) {
    const { data: profile } = await fetchProfileEmailByUserId(admin, userId);
    if (profile?.email) {
      await sendDocumentsApprovedEmail({
        to: profile.email as string,
        orgName: args.orgName,
        workspaceUrl,
      });
    }
  }
}

export async function notifyCustomerDocumentsMailed(
  admin: SupabaseClient,
  args: {
    organizationId: string;
    shipmentId: string;
    customerUserId: string;
    orgName: string;
    trackingNumber: string | null;
  },
): Promise<void> {
  const portalUrl = `${siteUrl()}/shipments/hub/${args.shipmentId}`;

  await insertAlert(admin, {
    organization_id: args.organizationId,
    shipment_id: args.shipmentId,
    alert_type: "DOCUMENTS_MAILED",
    severity: "info",
    message: args.trackingNumber
      ? `Original documents mailed — tracking: ${args.trackingNumber}`
      : "Original documents have been mailed",
    recipient_user_id: args.customerUserId,
  });

  const { data: profile } = await fetchProfileEmailByUserId(admin, args.customerUserId);
  if (profile?.email) {
    await sendDocumentsMailedEmail({
      to: profile.email as string,
      orgName: args.orgName,
      trackingNumber: args.trackingNumber,
      portalUrl,
    });
  }
}

export async function notifyOperatorsNewCustomerMessage(
  admin: SupabaseClient,
  args: {
    organizationId: string;
    shipmentId: string;
    containerId?: string | null;
    orgName: string;
    preview: string;
  },
): Promise<void> {
  const alertRecipients = await operatorRecipientIds(admin, args.shipmentId);
  const emailRecipients = await operatorEmailRecipientIds(admin, args.shipmentId);
  const url = `${siteUrl()}/shipments/${args.shipmentId}`;

  for (const userId of alertRecipients) {
    await insertAlert(admin, {
      organization_id: args.organizationId,
      shipment_id: args.shipmentId,
      container_id: args.containerId ?? null,
      alert_type: "MESSAGE_NEW",
      severity: "warning",
      message: args.preview.slice(0, 200),
      recipient_user_id: userId,
    });
  }

  for (const userId of emailRecipients) {
    const { data: profile } = await fetchProfileEmailByUserId(admin, userId);
    if (profile?.email) {
      await sendNewMessageEmail({
        to: profile.email as string,
        orgName: args.orgName,
        preview: args.preview,
        url,
        recipientRole: "operator",
      });
    }
  }
}

export async function notifyCustomerOperatorReply(
  admin: SupabaseClient,
  args: {
    organizationId: string;
    shipmentId: string;
    customerUserId: string;
    orgName: string;
    preview: string;
  },
): Promise<void> {
  const url = `${siteUrl()}/shipments/hub/${args.shipmentId}`;

  await insertAlert(admin, {
    organization_id: args.organizationId,
    shipment_id: args.shipmentId,
    alert_type: "MESSAGE_REPLY",
    severity: "info",
    message: args.preview.slice(0, 200),
    recipient_user_id: args.customerUserId,
  });

  const { data: profile } = await fetchProfileEmailByUserId(admin, args.customerUserId);
  if (profile?.email) {
    await sendNewMessageEmail({
      to: profile.email as string,
      orgName: args.orgName,
      preview: args.preview,
      url,
      recipientRole: "customer",
    });
  }
}

export async function notifyCustomerInviteSent(
  args: {
    to: string;
    orgName: string;
    inviteUrl: string;
  },
): Promise<void> {
  const { sendCustomerInviteEmail } = await import("@supabase-shared/email.service.ts");
  await sendCustomerInviteEmail(args);
}
