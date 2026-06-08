/**
 * Shipment hub / customer portal messaging (customers + org assignee/participant).
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { fetchProfileDisplayName } from "@supabase-shared/in-app-alerts.ts";
import { fetchProfileRole } from "@models/profiles.ts";
import { fetchMembershipByOrgAndUser } from "@models/organization_members.ts";
import { fetchReportMessageParentForReply, insertReportMessage } from "@models/report_messages.ts";
import { fetchAccessIdAndOrg } from "@models/shipment_customer_access.ts";
import { fetchShipmentParticipantForUser } from "@models/shipment_participants.ts";
import { fetchContainerIdAndShipmentId } from "@models/containers.ts";
import { fetchShipmentPortalOperatorRow } from "@models/shipments.ts";
import { postCustomerMessage } from "@supabase-shared/customer-access.service.ts";
import {
  notifyCustomersOperatorReply,
  notifyOperatorsNewCustomerMessage,
  notifyOperatorsTeamMessage,
} from "@supabase-shared/notification-workflow.service.ts";
import { fetchOrganizationForPortal } from "@models/organizations.ts";
import { recordMessageActivityEvent } from "@supabase-shared/message-activity.service.ts";

const MAX_BODY = 4000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Err = { ok: false; status: number; error: string };

type PortalMessageResult =
  | {
    ok: true;
    message: {
      id: string;
      body: string;
      author_display_name: string | null;
      created_at: string;
      author_kind: string;
    };
  }
  | Err;

async function isOrgMemberOnShipment(
  userClient: SupabaseClient,
  userId: string,
  shipmentId: string,
  organizationId: string,
  assigneeUserId: string | null | undefined,
): Promise<boolean> {
  const { data: profile } = await fetchProfileRole(userClient, userId);
  if ((profile?.role as string | undefined) === "superadmin") return true;

  if (assigneeUserId != null && assigneeUserId === userId) return true;

  const { data: membership } = await fetchMembershipByOrgAndUser(userClient, organizationId, userId);
  if (membership != null) return true;

  const { data: participant } = await fetchShipmentParticipantForUser(userClient, shipmentId, userId);
  return participant != null;
}

async function postOrgMemberPortalMessage(
  admin: SupabaseClient,
  userId: string,
  input: {
    organizationId: string;
    shipmentId: string;
    body: string;
    authorDisplayName: string | null;
    parentMessageId: string | null;
  },
): Promise<PortalMessageResult> {
  const { data: inserted, error: insErr } = await insertReportMessage(admin, {
    organization_id: input.organizationId,
    shipment_id: input.shipmentId,
    container_id: null,
    author_kind: "member",
    author_user_id: userId,
    is_internal: false,
    author_display_name: input.authorDisplayName,
    body: input.body,
    parent_message_id: input.parentMessageId,
  });
  if (insErr) return { ok: false, status: 500, error: insErr.message };
  if (!inserted) return { ok: false, status: 500, error: "Message was not saved" };

  await recordMessageActivityEvent(admin, {
    shipmentId: input.shipmentId,
    messageId: inserted.id as string,
    body: input.body,
    authorKind: "member",
    authorDisplayName: input.authorDisplayName?.trim() || "Team member",
    authorUserId: userId,
    containerId: null,
  });

  const preview = input.body;
  const { data: orgRow } = await fetchOrganizationForPortal(admin, input.organizationId);
  const orgName = (orgRow?.name as string | undefined) ?? "Containerly";

  try {
    await notifyOperatorsTeamMessage(admin, {
      organizationId: input.organizationId,
      shipmentId: input.shipmentId,
      actorUserId: userId,
      preview,
      reportMessageId: inserted.id as string,
    });
    await notifyCustomersOperatorReply(admin, {
      organizationId: input.organizationId,
      shipmentId: input.shipmentId,
      operatorUserId: userId,
      preview,
      reportMessageId: inserted.id as string,
    });
  } catch {
    /* best-effort */
  }

  const nowIso = new Date().toISOString();
  await admin.from("shipment_message_thread_reads").upsert(
    {
      organization_id: input.organizationId,
      user_id: userId,
      shipment_id: input.shipmentId,
      last_read_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id,shipment_id" },
  );

  return {
    ok: true,
    message: {
      id: inserted.id as string,
      body: inserted.body as string,
      author_display_name: inserted.author_display_name as string | null,
      created_at: inserted.created_at as string,
      author_kind: inserted.author_kind as string,
    },
  };
}

/** Post a customer-visible message on the shipment portal (customer, assignee, or participant). */
export async function postPortalShipmentMessage(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
  input: {
    shipment_id: string;
    container_id?: string;
    body: string;
    author_display_name?: string;
    parent_message_id?: string | null;
  },
): Promise<PortalMessageResult> {
  const shipmentId = input.shipment_id?.trim() ?? "";
  const containerId = input.container_id?.trim() ?? "";
  const text = input.body?.trim() ?? "";
  const parentRaw = (typeof input.parent_message_id === "string" ? input.parent_message_id : "").trim();
  const parentId = parentRaw && UUID_RE.test(parentRaw) ? parentRaw : null;
  const shipmentScoped = !containerId;

  if (!shipmentId || !UUID_RE.test(shipmentId)) {
    return { ok: false, status: 400, error: "Invalid shipment_id" };
  }
  if (!shipmentScoped && (!containerId || !UUID_RE.test(containerId))) {
    return { ok: false, status: 400, error: "Invalid container_id" };
  }
  if (!text || text.length > MAX_BODY) {
    return { ok: false, status: 400, error: "Message body required (max 4000 chars)" };
  }

  const { data: shipment, error: shErr } = await fetchShipmentPortalOperatorRow(userClient, shipmentId);
  if (shErr) return { ok: false, status: 500, error: shErr.message };
  if (!shipment) return { ok: false, status: 404, error: "Shipment not found" };

  const organizationId = shipment.organization_id as string;
  const assigneeUserId = shipment.assignee_user_id as string | null | undefined;

  const isOrgMember = await isOrgMemberOnShipment(
    userClient,
    userId,
    shipmentId,
    organizationId,
    assigneeUserId,
  );

  if (isOrgMember) {
    if (!shipmentScoped) {
      const { data: cont, error: cErr } = await fetchContainerIdAndShipmentId(userClient, containerId);
      if (cErr || !cont || (cont.shipment_id as string) !== shipmentId) {
        return { ok: false, status: 400, error: "container_id is not on this shipment" };
      }
    }

    if (parentId) {
      const { data: parent, error: parentErr } = await fetchReportMessageParentForReply(admin, parentId);
      if (parentErr) throw parentErr;
      if (!parent) return { ok: false, status: 400, error: "Invalid parent message" };
      if (parent.is_internal === true) {
        return { ok: false, status: 400, error: "Cannot reply to an internal message" };
      }
      if (shipmentScoped) {
        if ((parent.shipment_id as string | null) !== shipmentId || parent.container_id != null) {
          return { ok: false, status: 400, error: "Invalid parent message" };
        }
      } else if ((parent.container_id as string) !== containerId) {
        return { ok: false, status: 400, error: "Invalid parent message" };
      }
    }

    const displayName =
      input.author_display_name?.trim().slice(0, 120) ||
      (await fetchProfileDisplayName(admin, userId));

    return postOrgMemberPortalMessage(admin, userId, {
      organizationId,
      shipmentId,
      body: text,
      authorDisplayName: displayName,
      parentMessageId: parentId,
    });
  }

  const customerResult = await postCustomerMessage(userClient, admin, userId, {
    shipment_id: shipmentId,
    container_id: shipmentScoped ? undefined : containerId,
    body: text,
    author_display_name: input.author_display_name,
    parent_message_id: parentId,
  });

  if (!customerResult.ok) return customerResult;
  return { ok: true, message: customerResult.message };
}
