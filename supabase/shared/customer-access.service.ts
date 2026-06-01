import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { DEFAULT_CUSTOMER_VISIBILITY } from "@supabase-shared/shipment-portal-payload.ts";
import {
  fetchCustomerInviteByTokenHash,
  fetchPendingInviteByEmailForShipment,
  insertCustomerInvite,
  updateCustomerInviteStatus,
} from "@models/customer_invites.ts";
import { countMembershipsForUser } from "@models/organization_members.ts";
import { insertReportActivity } from "@models/report_activity.ts";
import {
  fetchReportMessageParentForReply,
  insertReportMessage,
} from "@models/report_messages.ts";
import {
  fetchAccessIdAndOrg,
  fetchAccessIdForUser,
  fetchActiveAccessId,
  insertShipmentCustomerAccess,
  updateShipmentCustomerAccess,
} from "@models/shipment_customer_access.ts";
import { fetchShipmentIdAndOrganization } from "@models/shipments.ts";
import { fetchOrganizationForPortal } from "@models/organizations.ts";
import { fetchContainerIdAndShipmentId } from "@models/containers.ts";
import { updateProfileAccountKind } from "@models/profiles.ts";
import type {
  AcceptCustomerInviteResponse,
  ClaimShipmentAccessResponse,
  CreateCustomerInviteResponse,
  CompleteCustomerSetupResponse,
  PostCustomerMessageResponse,
} from "@shared/dto/customer-access.dto.ts";
import { notifyCustomerInviteSent, notifyOperatorsNewCustomerMessage } from "@supabase-shared/notification-workflow.service.ts";

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomTokenHex(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REMINDER_DAYS = 14;
const MAX_BODY = 4000;

// ---------------------------------------------------------------------------
// Service result type
// ---------------------------------------------------------------------------

type Err = { ok: false; status: number; error: string; expected_email_hint?: string };

// ---------------------------------------------------------------------------
// create-customer-invite
// ---------------------------------------------------------------------------

export async function createCustomerInvite(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
  input: {
    organization_id: string;
    shipment_id: string;
    invited_email: string;
    visibility_settings?: Record<string, unknown>;
    delivery_mode?: "email_invite" | "allowlist_only";
  },
): Promise<{ ok: true } & CreateCustomerInviteResponse | Err> {
  const orgId = input.organization_id.trim();
  const shipmentId = input.shipment_id.trim();
  const emailRaw = input.invited_email.trim().toLowerCase();

  if (!orgId || !UUID_RE.test(orgId)) return { ok: false, status: 400, error: "Invalid organization_id" };
  if (!shipmentId || !UUID_RE.test(shipmentId)) return { ok: false, status: 400, error: "Invalid shipment_id" };
  if (!emailRaw || !emailRaw.includes("@")) return { ok: false, status: 400, error: "Valid invited_email required" };

  const { data: row, error: shErr } = await fetchShipmentIdAndOrganization(userClient, shipmentId);
  if (shErr || !row) return { ok: false, status: 404, error: "Shipment not found" };
  if ((row.organization_id as string) !== orgId) {
    return { ok: false, status: 400, error: "Shipment does not belong to organization" };
  }

  const token = randomTokenHex(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const visibility = {
    ...DEFAULT_CUSTOMER_VISIBILITY,
    ...(input.visibility_settings && typeof input.visibility_settings === "object"
      ? input.visibility_settings
      : {}),
  };

  const deliveryMode = input.delivery_mode === "allowlist_only" ? "allowlist_only" : "email_invite";

  const { data: invite, error: insErr } = await insertCustomerInvite(admin, {
    organization_id: orgId,
    shipment_id: shipmentId,
    invited_email: emailRaw,
    invited_by_user_id: userId,
    token_hash: tokenHash,
    status: "pending",
    expires_at: expiresAt,
    visibility_settings: visibility,
    delivery_mode: deliveryMode,
  });
  if (insErr) throw insErr;
  if (!invite) throw new Error("insertCustomerInvite returned no row");

  await insertReportActivity(admin, {
    shipment_id: shipmentId,
    shared_report_id: null,
    actor_user_id: userId,
    action: "customer_invite_created",
    metadata: { invite_id: invite.id, invited_email: emailRaw, visibility_settings: visibility },
  });

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "") ?? "";
  const invitePath = `/invite/accept?token=${encodeURIComponent(token)}`;
  const invite_url = siteUrl ? `${siteUrl}${invitePath}` : invitePath;

  const { data: orgRow } = await fetchOrganizationForPortal(admin, orgId);
  const orgName = (orgRow?.name as string | undefined) ?? "Your logistics team";

  if (deliveryMode === "email_invite") {
    await notifyCustomerInviteSent({
      to: emailRaw,
      orgName,
      inviteUrl: invite_url,
    });
  }

  return {
    ok: true,
    invite_id: invite.id as string,
    invite_url,
    expires_at: invite.expires_at as string,
    token,
    visibility_settings: visibility,
  };
}

// ---------------------------------------------------------------------------
// accept-customer-invite
// ---------------------------------------------------------------------------

export async function acceptCustomerInvite(
  admin: SupabaseClient,
  userId: string,
  userEmail: string,
  token: string,
): Promise<{ ok: true } & AcceptCustomerInviteResponse | Err> {
  if (!token.trim()) return { ok: false, status: 400, error: "token required" };

  const tokenHash = await sha256Hex(token.trim());

  const { data: invite, error: invErr } = await fetchCustomerInviteByTokenHash(admin, tokenHash);
  if (invErr) throw invErr;
  if (!invite) return { ok: false, status: 404, error: "Invalid or expired invite" };

  if (invite.status !== "pending") {
    return {
      ok: false,
      status: 409,
      error: invite.status === "accepted" ? "Invite already accepted" : "Invite is no longer valid",
    };
  }

  if (new Date(invite.expires_at as string) < new Date()) {
    await updateCustomerInviteStatus(admin, invite.id as string, { status: "expired" });
    return { ok: false, status: 410, error: "This invite has expired" };
  }

  const invitedEmail = String(invite.invited_email).trim().toLowerCase();
  if (userEmail !== invitedEmail) {
    return {
      ok: false,
      status: 403,
      error: "Signed-in email does not match the invitation. Sign in with the invited address.",
      expected_email_hint: invitedEmail.replace(/(^.).*(@.*$)/, "$1***$2"),
    };
  }

  const shipmentId = invite.shipment_id as string;
  const orgId = invite.organization_id as string;

  const { data: existing } = await fetchActiveAccessId(admin, shipmentId, userId);

  if (existing) {
    await updateCustomerInviteStatus(admin, invite.id as string, {
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_user_id: userId,
    });
    return { ok: true, already_had_access: true, shipment_id: shipmentId, shipment_access_id: existing.id as string };
  }

  const vis = invite.visibility_settings as Record<string, unknown> | null | undefined;
  const visibility_settings = {
    ...DEFAULT_CUSTOMER_VISIBILITY,
    ...(vis && typeof vis === "object" && !Array.isArray(vis) ? vis : {}),
  };

  const reminderDue = new Date(Date.now() + REMINDER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: access, error: accErr } = await insertShipmentCustomerAccess(admin, {
    organization_id: orgId,
    shipment_id: shipmentId,
    customer_user_id: userId,
    invite_id: invite.id as string,
    visibility_settings,
    configuration_reminder_due_at: reminderDue,
  });
  if (accErr) throw accErr;
  if (!access) throw new Error("insertShipmentCustomerAccess returned no row");

  await updateCustomerInviteStatus(admin, invite.id as string, {
    status: "accepted",
    accepted_at: new Date().toISOString(),
    accepted_by_user_id: userId,
  });

  await insertReportActivity(admin, {
    shipment_id: shipmentId,
    shared_report_id: null,
    shipment_customer_access_id: access.id as string,
    actor_user_id: userId,
    action: "customer_invite_accepted",
    metadata: { invite_id: invite.id },
  });

  const { count: memberCount } = await countMembershipsForUser(admin, userId);

  if ((memberCount ?? 0) === 0) {
    await updateProfileAccountKind(admin, userId, "customer");
  }

  return { ok: true, shipment_id: shipmentId, shipment_access_id: access.id as string };
}

// ---------------------------------------------------------------------------
// claim-shipment-access (Notion-style allowlist)
// ---------------------------------------------------------------------------

export async function claimShipmentAccess(
  admin: SupabaseClient,
  userId: string,
  userEmail: string,
  shipmentId: string,
): Promise<{ ok: true } & ClaimShipmentAccessResponse | Err> {
  if (!shipmentId || !UUID_RE.test(shipmentId)) {
    return { ok: false, status: 400, error: "Invalid shipment_id" };
  }

  const email = userEmail.trim().toLowerCase();
  const { data: existing } = await fetchActiveAccessId(admin, shipmentId, userId);
  if (existing?.id) {
    return {
      ok: true,
      access_id: existing.id as string,
      shipment_id: shipmentId,
      already_had_access: true,
    };
  }

  const { data: invite, error: invErr } = await fetchPendingInviteByEmailForShipment(
    admin,
    shipmentId,
    email,
  );
  if (invErr) throw invErr;
  if (!invite) {
    return { ok: false, status: 403, error: "No pending invitation for this email on this shipment" };
  }

  const orgId = invite.organization_id as string;
  const vis = invite.visibility_settings as Record<string, unknown> | null | undefined;
  const visibility_settings = {
    ...DEFAULT_CUSTOMER_VISIBILITY,
    ...(vis && typeof vis === "object" && !Array.isArray(vis) ? vis : {}),
  };
  const reminderDue = new Date(Date.now() + REMINDER_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: access, error: accErr } = await insertShipmentCustomerAccess(admin, {
    organization_id: orgId,
    shipment_id: shipmentId,
    customer_user_id: userId,
    invite_id: invite.id as string,
    visibility_settings,
    configuration_reminder_due_at: reminderDue,
  });
  if (accErr) throw accErr;
  if (!access) throw new Error("insertShipmentCustomerAccess returned no row");

  await updateCustomerInviteStatus(admin, invite.id as string, {
    status: "accepted",
    accepted_at: new Date().toISOString(),
    accepted_by_user_id: userId,
  });

  await insertReportActivity(admin, {
    shipment_id: shipmentId,
    shared_report_id: null,
    shipment_customer_access_id: access.id as string,
    actor_user_id: userId,
    action: "customer_invite_accepted",
    metadata: { invite_id: invite.id, claim: true },
  });

  const { count: memberCount } = await countMembershipsForUser(admin, userId);
  if ((memberCount ?? 0) === 0) {
    await updateProfileAccountKind(admin, userId, "customer");
  }

  return {
    ok: true,
    access_id: access.id as string,
    shipment_id: shipmentId,
  };
}

// ---------------------------------------------------------------------------
// complete-customer-shipment-setup
// ---------------------------------------------------------------------------

export async function completeCustomerSetup(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
  shipmentId: string,
): Promise<{ ok: true } & CompleteCustomerSetupResponse | Err> {
  if (!shipmentId || !UUID_RE.test(shipmentId)) {
    return { ok: false, status: 400, error: "Invalid shipment_id" };
  }

  const { data: access, error: accErr } = await fetchAccessIdForUser(userClient, shipmentId, userId);

  if (accErr) return { ok: false, status: 500, error: accErr.message };
  if (!access) return { ok: false, status: 403, error: "No access to this shipment" };

  const now = new Date().toISOString();
  const { error: upErr } = await updateShipmentCustomerAccess(admin, access.id as string, {
    profile_completed_at: now,
    configuration_reminder_due_at: null,
  });
  if (upErr) throw upErr;

  return { ok: true, profile_completed_at: now };
}

// ---------------------------------------------------------------------------
// post-customer-shipment-message
// ---------------------------------------------------------------------------

export async function postCustomerMessage(
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
): Promise<{ ok: true } & PostCustomerMessageResponse | Err> {
  const shipmentId = input.shipment_id?.trim() ?? "";
  const containerId = input.container_id?.trim() ?? "";
  const text = input.body?.trim() ?? "";
  const name = input.author_display_name?.trim().slice(0, 120) ?? null;
  const parentRaw = (typeof input.parent_message_id === "string" ? input.parent_message_id : "").trim();
  const parentId = parentRaw && UUID_RE.test(parentRaw) ? parentRaw : null;
  const shipmentScoped = !containerId;

  if (!shipmentId || !UUID_RE.test(shipmentId)) return { ok: false, status: 400, error: "Invalid shipment_id" };
  if (!shipmentScoped && (!containerId || !UUID_RE.test(containerId))) {
    return { ok: false, status: 400, error: "Invalid container_id" };
  }
  if (!text || text.length > MAX_BODY) {
    return { ok: false, status: 400, error: "Message body required (max 4000 chars)" };
  }

  const { data: access, error: accErr } = await fetchAccessIdAndOrg(userClient, shipmentId, userId);

  if (accErr) return { ok: false, status: 500, error: accErr.message };
  if (!access) return { ok: false, status: 403, error: "No access to this shipment" };

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
    if (shipmentScoped) {
      if ((parent.shipment_id as string | null) !== shipmentId || parent.container_id != null) {
        return { ok: false, status: 400, error: "Invalid parent message" };
      }
    } else {
      if ((parent.container_id as string) !== containerId) {
        return { ok: false, status: 400, error: "Invalid parent message" };
      }
    }
    if (parent.is_internal === true) {
      return { ok: false, status: 400, error: "Cannot reply to an internal message" };
    }
  }

  const insertRow = shipmentScoped
    ? {
        shipment_id: shipmentId,
        container_id: null as string | null,
        author_kind: "customer" as const,
        author_user_id: userId,
        is_internal: false,
        author_display_name: name,
        body: text,
        parent_message_id: parentId,
      }
    : {
        container_id: containerId,
        shipment_id: null as string | null,
        author_kind: "customer" as const,
        author_user_id: userId,
        is_internal: false,
        author_display_name: name,
        body: text,
        parent_message_id: parentId,
      };

  const { data: inserted, error: insErr } = await insertReportMessage(admin, insertRow);
  if (insErr) throw insErr;
  if (!inserted) throw new Error("insertReportMessage returned no row");

  await insertReportActivity(admin, {
    shipment_id: shipmentId,
    container_id: shipmentScoped ? null : containerId,
    shared_report_id: null,
    shipment_customer_access_id: access.id as string,
    actor_user_id: userId,
    action: "customer_message",
    metadata: { message_id: inserted.id },
  });

  const { data: orgRow } = await fetchOrganizationForPortal(admin, access.organization_id as string);
  await notifyOperatorsNewCustomerMessage(admin, {
    organizationId: access.organization_id as string,
    shipmentId,
    containerId: shipmentScoped ? null : containerId,
    orgName: (orgRow?.name as string | undefined) ?? "Containerly",
    preview: text,
  });

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
