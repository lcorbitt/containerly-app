/**
 * Notification helpers: in-app alerts + email for workflow events.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  notifyOperatorsBolImported,
  notifyOperatorsCustomerAccessGranted,
  notifyOperatorsCustomerDocumentUploaded,
  notifyOperatorsDraftsPublished,
  notifyOperatorsOperatorRepliedToCustomer,
  notifyOperatorsOriginalsMailed,
  notifyOperatorsTeamMessage,
  notifyOperatorsTrackingLinked,
  notifyOperatorsTrackingSyncFailed,
  notifyOrgAdminsMemberJoined,
  notifyShipmentStakeholdersCarrierAlert,
  notifyShipmentStakeholdersInApp,
  notifyUserAssignedAsAssignee,
  notifyUserAssignedAsParticipant,
  notifyUserRemovedAsParticipant,
  notifyUserUnassignedAsAssignee,
} from "@supabase-shared/in-app-alerts.ts";
import { insertAlert } from "@models/alerts.ts";
import { fetchProfileEmailByUserId } from "@models/profiles.ts";
import { listShipmentNotificationSubscriberUserIds } from "@models/shipment_notification_subscriptions.ts";
import {
  sendDocumentRejectedEmail,
  sendDocumentsApprovedEmail,
  sendDocumentsMailedEmail,
  sendNewMessageEmail,
} from "@supabase-shared/email.service.ts";

export {
  notifyOrgAdminsMemberJoined,
  notifyOperatorsBolImported,
  notifyOperatorsCustomerAccessGranted,
  notifyOperatorsCustomerDocumentUploaded,
  notifyOperatorsDraftsPublished,
  notifyOperatorsTrackingLinked,
  notifyOperatorsTrackingSyncFailed,
  notifyShipmentStakeholdersCarrierAlert,
  notifyUserAssignedAsAssignee,
  notifyUserAssignedAsParticipant,
  notifyUserRemovedAsParticipant,
  notifyUserUnassignedAsAssignee,
  notifyOperatorsTeamMessage,
  notifyOperatorsOperatorRepliedToCustomer,
  notifyOperatorsOriginalsMailed,
};

function siteUrl(): string {
  return Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "") ?? "";
}

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
  const emailRecipients = await operatorEmailRecipientIds(admin, args.shipmentId);
  const workspaceUrl = `${siteUrl()}/shipments/${args.shipmentId}`;

  await notifyShipmentStakeholdersInApp(admin, {
    organizationId: args.organizationId,
    shipmentId: args.shipmentId,
    containerId: args.containerId,
    alertType: "DOCUMENT_REJECTED",
    severity: "critical",
    message: `Document rejected: ${args.fileName}`,
  });

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
  const emailRecipients = await operatorEmailRecipientIds(admin, args.shipmentId);
  const workspaceUrl = `${siteUrl()}/shipments/${args.shipmentId}`;

  await notifyShipmentStakeholdersInApp(admin, {
    organizationId: args.organizationId,
    shipmentId: args.shipmentId,
    alertType: "DOCUMENTS_APPROVED",
    severity: "info",
    message: "All draft documents approved by customer",
  });

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
    actorUserId: string;
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

  await notifyOperatorsOriginalsMailed(admin, {
    organizationId: args.organizationId,
    shipmentId: args.shipmentId,
    actorUserId: args.actorUserId,
    trackingNumber: args.trackingNumber,
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
    customerUserId: string;
  },
): Promise<void> {
  const emailRecipients = await operatorEmailRecipientIds(admin, args.shipmentId);
  const url = `${siteUrl()}/shipments/${args.shipmentId}`;

  await notifyShipmentStakeholdersInApp(admin, {
    organizationId: args.organizationId,
    shipmentId: args.shipmentId,
    containerId: args.containerId,
    alertType: "MESSAGE_NEW",
    severity: "warning",
    message: args.preview.slice(0, 200),
    excludeUserId: args.customerUserId,
    actorUserId: args.customerUserId,
  });

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
    operatorUserId: string;
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
    actor_user_id: args.operatorUserId,
  });

  await notifyOperatorsOperatorRepliedToCustomer(admin, {
    organizationId: args.organizationId,
    shipmentId: args.shipmentId,
    actorUserId: args.operatorUserId,
    preview: args.preview,
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
