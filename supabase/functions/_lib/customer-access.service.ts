import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { DEFAULT_CUSTOMER_VISIBILITY } from "@supabase-shared/shipment-portal-payload.ts";
import {
  fetchCustomerInviteByTokenHash,
  fetchInviteByEmailForShipment,
  fetchPendingInviteForRefresh,
  insertCustomerInvite,
  updateCustomerInviteById,
  updateCustomerInviteStatus,
} from "@models/customer_invites.ts";
import {
  countMembershipsForUser,
  fetchOrgOperatorMembershipForUser,
} from "@models/organization_members.ts";
import { insertReportActivity } from "@models/report_activity.ts";
import { resolveAccessRequestAlerts } from "@models/alerts.ts";
import { recordMessageActivityEvent } from "@supabase-shared/message-activity.service.ts";
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
import {
  notifyAssigneeAccessRequest,
  notifyCustomerInviteSent,
  notifyOperatorsCustomerAccessGranted,
  notifyOperatorsNewCustomerMessage,
} from "@supabase-shared/notification-workflow.service.ts";
import {
  fetchProfileDisplayName,
  listOrgAdminUserIds,
  notifyCustomerInviteReceived,
} from "@supabase-shared/in-app-alerts.ts";
import { fetchProfileIdAndRoleByEmail, fetchProfileIdByEmail } from "@models/profiles.ts";
import { fetchShipmentParticipantForUser } from "@models/shipment_participants.ts";
import { fetchShipmentPortalOperatorRow } from "@models/shipments.ts";
import { fetchActiveAccessForProfileEmailOnShipment } from "@models/shipment_customer_access.ts";
import {
  approvePendingAccessRequestsForEmail,
  fetchAccessRequestById,
  fetchPendingAccessRequestByEmailForShipment,
  insertShipmentCustomerAccessRequest,
  updateAccessRequest,
} from "@models/shipment_customer_access_requests.ts";
import type {
  CheckPortalAccessEmailResponse,
  PreviewCustomerInviteResponse,
  ResolveCustomerAccessRequestResponse,
} from "@shared/dto/customer-access.dto.ts";

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

/** Returned when invited_email matches an org admin/member or platform superadmin. */
export const CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR =
  "This email belongs to someone on your organization team (admin or member). Customer invites are only for external importer contacts.";

export const CUSTOMER_INVITE_SUPERADMIN_EMAIL_ERROR =
  "This email belongs to a platform administrator. Customer invites are only for external importer contacts.";

/** Importer accounts: no org membership → `profiles.account_kind = customer`. */
async function ensureCustomerProfileKind(admin: SupabaseClient, userId: string): Promise<void> {
  const { count: memberCount } = await countMembershipsForUser(admin, userId);
  if ((memberCount ?? 0) === 0) {
    await updateProfileAccountKind(admin, userId, "customer");
  }
}

async function customerInviteBlockedForOperatorEmail(
  admin: SupabaseClient,
  organizationId: string,
  emailLower: string,
): Promise<string | null> {
  const { data: profile } = await fetchProfileIdAndRoleByEmail(admin, emailLower);
  if (!profile?.id) return null;

  if ((profile.role as string | undefined) === "superadmin") {
    return CUSTOMER_INVITE_SUPERADMIN_EMAIL_ERROR;
  }

  const { data: membership } = await fetchOrgOperatorMembershipForUser(
    admin,
    organizationId,
    profile.id as string,
  );
  if (membership?.role) {
    return CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR;
  }

  return null;
}

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

  const operatorEmailError = await customerInviteBlockedForOperatorEmail(admin, orgId, emailRaw);
  if (operatorEmailError) {
    return { ok: false, status: 400, error: operatorEmailError };
  }

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

  // Dedupe: reuse an existing pending invite for this (shipment, email) instead of stacking
  // rows. A partial unique index enforces one pending invite per pair; refreshing in place
  // (new token + expiry) doubles as a "resend".
  const { data: existingPending } = await fetchPendingInviteForRefresh(admin, shipmentId, emailRaw);

  const inviteFields = {
    organization_id: orgId,
    shipment_id: shipmentId,
    invited_email: emailRaw,
    invited_by_user_id: userId,
    token_hash: tokenHash,
    status: "pending",
    expires_at: expiresAt,
    visibility_settings: visibility,
    delivery_mode: deliveryMode,
  };

  const { data: invite, error: insErr } = existingPending?.id
    ? await updateCustomerInviteById(admin, existingPending.id as string, inviteFields)
    : await insertCustomerInvite(admin, inviteFields);
  if (insErr) throw insErr;
  if (!invite) throw new Error("customer invite upsert returned no row");

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
  // Email CTA points at the hub: the customer enters their email there and receives a
  // passwordless sign-in link (low-friction). The token `invite_url` above is retained
  // for the operator copy-link and the legacy /invite/accept route.
  const hubPath = `/shipments/hub/${shipmentId}`;
  const hub_url = siteUrl ? `${siteUrl}${hubPath}` : hubPath;

  const { data: orgRow } = await fetchOrganizationForPortal(admin, orgId);
  const orgName = (orgRow?.name as string | undefined) ?? "Your logistics team";

  if (deliveryMode === "email_invite") {
    const emailResult = await notifyCustomerInviteSent({
      to: emailRaw,
      orgName,
      inviteUrl: hub_url,
    });
    if (!emailResult.ok) {
      return {
        ok: false,
        status: 502,
        error: `Invite saved but email could not be sent: ${emailResult.error}`,
      };
    }
    const { data: existingProfile } = await fetchProfileIdByEmail(admin, emailRaw);
    if (existingProfile?.id) {
      await notifyCustomerInviteReceived(admin, {
        organizationId: orgId,
        shipmentId,
        recipientUserId: existingProfile.id as string,
        invitedByUserId: userId,
        inviteUrl: invite_url,
      });
    }
  }

  // Converge with the customer-initiated path: if this email already had a pending access
  // request, the operator's invite supersedes it — auto-approve so it leaves the request queue.
  await approvePendingAccessRequestsForEmail(admin, shipmentId, emailRaw, {
    invite_id: invite.id as string,
    resolved_by_user_id: userId,
  });

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
    await ensureCustomerProfileKind(admin, userId);
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

  await ensureCustomerProfileKind(admin, userId);

  const customerName = await fetchProfileDisplayName(admin, userId);
  await notifyOperatorsCustomerAccessGranted(admin, {
    organizationId: orgId,
    shipmentId,
    customerDisplayName: customerName,
    actorUserId: userId,
  });

  return { ok: true, shipment_id: shipmentId, shipment_access_id: access.id as string };
}

// ---------------------------------------------------------------------------
// claim-shipment-access (Notion-style allowlist)
// ---------------------------------------------------------------------------

/**
 * Grant a user access to a shipment from an invite row (idempotent): reuses an existing
 * active grant, otherwise inserts `shipment_customer_access`, marks the invite accepted,
 * records activity, types the profile as a customer, and notifies operators. Shared by
 * `claimShipmentAccess` and the portal instant sign-in gate.
 */
async function grantShipmentAccessFromInvite(
  admin: SupabaseClient,
  userId: string,
  invite: Record<string, unknown>,
): Promise<string> {
  const shipmentId = invite.shipment_id as string;
  const orgId = invite.organization_id as string;
  const invitedEmail = String(invite.invited_email ?? "").trim().toLowerCase();

  const { data: existing } = await fetchActiveAccessId(admin, shipmentId, userId);
  if (existing?.id) {
    await ensureCustomerProfileKind(admin, userId);
    // Access already granted (e.g. via the other path) — still converge any open request.
    if (invitedEmail) {
      await approvePendingAccessRequestsForEmail(admin, shipmentId, invitedEmail, {
        invite_id: invite.id as string,
        access_id: existing.id as string,
      });
    }
    return existing.id as string;
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
    metadata: { invite_id: invite.id, claim: true },
  });

  await ensureCustomerProfileKind(admin, userId);

  const customerName = await fetchProfileDisplayName(admin, userId);
  await notifyOperatorsCustomerAccessGranted(admin, {
    organizationId: orgId,
    shipmentId,
    customerDisplayName: customerName,
    actorUserId: userId,
  });

  // Converge any customer-initiated request for this email onto the now-granted access.
  if (invitedEmail) {
    await approvePendingAccessRequestsForEmail(admin, shipmentId, invitedEmail, {
      invite_id: invite.id as string,
      access_id: access.id as string,
    });
  }

  return access.id as string;
}

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

  // Honor any non-revoked invite for this email+shipment (ignoring expiry — the operator
  // deliberately invited them; expiry is enforced only on the legacy token-accept path).
  const { data: invite, error: invErr } = await fetchInviteByEmailForShipment(
    admin,
    shipmentId,
    email,
  );
  if (invErr) throw invErr;
  if (!invite) {
    return { ok: false, status: 403, error: "No invitation for this email on this shipment" };
  }

  const accessId = await grantShipmentAccessFromInvite(admin, userId, invite);

  return {
    ok: true,
    access_id: accessId,
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

  const orgId = access.organization_id as string;
  const insertRow = shipmentScoped
    ? {
        organization_id: orgId,
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
        organization_id: orgId,
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

  try {
    await recordMessageActivityEvent(admin, {
      shipmentId,
      messageId: inserted.id as string,
      body: text,
      authorKind: "customer",
      authorDisplayName: name,
      authorUserId: userId,
      containerId: shipmentScoped ? null : containerId,
    });
  } catch {
    /* best-effort */
  }

  const { data: orgRow } = await fetchOrganizationForPortal(admin, access.organization_id as string);
  await notifyOperatorsNewCustomerMessage(admin, {
    organizationId: access.organization_id as string,
    shipmentId,
    containerId: shipmentScoped ? null : containerId,
    orgName: (orgRow?.name as string | undefined) ?? "Containerly",
    preview: text,
    customerUserId: userId,
    reportMessageId: inserted.id as string,
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

// ---------------------------------------------------------------------------
// check-portal-access-email (anonymous gate)
// ---------------------------------------------------------------------------

const GENERIC_PORTAL_EMAIL_MESSAGE =
  "If this email is invited to this shipment you'll be signed in automatically. Otherwise, your request has been sent to the team.";

const SIGNED_IN_MESSAGE = "You're invited — signing you in…";

/** Resolve (or create) the passwordless customer auth user for an email; returns the user id. */
async function ensurePortalUserId(admin: SupabaseClient, email: string): Promise<string> {
  const lower = email.trim().toLowerCase();

  const { data: existingProfile } = await fetchProfileIdByEmail(admin, lower);
  if (existingProfile?.id) return existingProfile.id as string;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: lower,
    email_confirm: true,
  });
  if (!createErr && created?.user?.id) {
    await ensureCustomerProfileKind(admin, created.user.id);
    return created.user.id;
  }
  if (createErr && !/already.*(registered|exists)/i.test(createErr.message)) {
    throw new Error(`Could not create customer account: ${createErr.message}`);
  }

  // Race / pre-existing auth user without a cached profile id: re-resolve via profile.
  const { data: reProfile } = await fetchProfileIdByEmail(admin, lower);
  if (reProfile?.id) {
    await ensureCustomerProfileKind(admin, reProfile.id as string);
    return reProfile.id as string;
  }
  throw new Error("Could not resolve customer account for sign-in");
}

/**
 * Generate a one-time sign-in token (Supabase magic-link OTP) for an email. We return the
 * `token_hash` to the browser, which verifies it client-side to establish a session
 * immediately — no email round-trip. Gated server-side by the invite check below.
 */
async function issuePortalSignInToken(
  admin: SupabaseClient,
  email: string,
  shipmentId: string,
): Promise<{ token_hash: string; token_type: "magiclink" }> {
  const siteUrl = Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "") ?? "";
  const redirectTo = `${siteUrl}/shipments/hub/${shipmentId}`;

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: email.trim().toLowerCase(),
    options: { redirectTo },
  });
  if (linkErr || !linkData) {
    throw new Error(`Could not generate sign-in token: ${linkErr?.message ?? "unknown"}`);
  }

  const props = linkData.properties as { hashed_token?: string } | undefined;
  const tokenHash = props?.hashed_token;
  if (!tokenHash) {
    throw new Error("Sign-in token generation returned no token");
  }
  return { token_hash: tokenHash, token_type: "magiclink" };
}

export async function checkPortalAccessEmail(
  admin: SupabaseClient,
  input: { shipment_id: string; email: string },
): Promise<{ ok: true } & CheckPortalAccessEmailResponse | Err> {
  const shipmentId = input.shipment_id.trim();
  const emailRaw = input.email.trim().toLowerCase();

  if (!shipmentId || !UUID_RE.test(shipmentId)) {
    return { ok: false, status: 400, error: "Invalid shipment_id" };
  }
  if (!emailRaw || !emailRaw.includes("@")) {
    return { ok: false, status: 400, error: "Valid email required" };
  }

  const { data: row } = await fetchShipmentIdAndOrganization(admin, shipmentId);
  if (!row) {
    return {
      ok: true,
      message: GENERIC_PORTAL_EMAIL_MESSAGE,
      outcome: "request_sent",
    };
  }

  const orgId = row.organization_id as string;

  // Any non-revoked invite (ignoring expiry) or an existing active grant entitles access.
  const { data: invite } = await fetchInviteByEmailForShipment(admin, shipmentId, emailRaw);
  const { data: activeAccess } = await fetchActiveAccessForProfileEmailOnShipment(
    admin,
    shipmentId,
    emailRaw,
  );

  if (invite || activeAccess?.id) {
    try {
      const userId = await ensurePortalUserId(admin, emailRaw);
      if (invite) {
        await grantShipmentAccessFromInvite(admin, userId, invite as Record<string, unknown>);
      }
      const { token_hash, token_type } = await issuePortalSignInToken(admin, emailRaw, shipmentId);
      return {
        ok: true,
        message: SIGNED_IN_MESSAGE,
        outcome: "signed_in",
        token_hash,
        token_type,
      };
    } catch (e) {
      return {
        ok: false,
        status: 502,
        error: e instanceof Error ? e.message : "Could not sign you in",
      };
    }
  }

  const { data: existingRequest } = await fetchPendingAccessRequestByEmailForShipment(
    admin,
    shipmentId,
    emailRaw,
  );
  if (existingRequest?.id) {
    return {
      ok: true,
      message: GENERIC_PORTAL_EMAIL_MESSAGE,
      outcome: "already_requested",
    };
  }

  const { data: shipRow } = await fetchShipmentPortalOperatorRow(admin, shipmentId);
  const { data: accessRequest, error: insErr } = await insertShipmentCustomerAccessRequest(admin, {
    organization_id: orgId,
    shipment_id: shipmentId,
    requester_email: emailRaw,
    status: "pending",
  });
  if (insErr) throw insErr;
  if (!accessRequest) throw new Error("insertShipmentCustomerAccessRequest returned no row");

  const { data: orgRow } = await fetchOrganizationForPortal(admin, orgId);
  const orgName = (orgRow?.name as string | undefined) ?? "Your logistics team";

  let recipientId = (shipRow?.assignee_user_id as string | null | undefined) ?? null;
  if (!recipientId) {
    const admins = await listOrgAdminUserIds(admin, orgId);
    recipientId = admins[0] ?? null;
  }
  if (recipientId) {
    await notifyAssigneeAccessRequest(admin, {
      organizationId: orgId,
      shipmentId,
      assigneeUserId: recipientId,
      requesterEmail: emailRaw,
      accessRequestId: accessRequest.id as string,
      orgName,
    });
  }

  return {
    ok: true,
    message: GENERIC_PORTAL_EMAIL_MESSAGE,
    outcome: "request_sent",
  };
}

// ---------------------------------------------------------------------------
// resolve-customer-access-request
// ---------------------------------------------------------------------------

async function userCanResolveAccessRequest(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
  shipmentId: string,
  organizationId: string,
): Promise<boolean> {
  const [{ data: ship }, { data: participant }, { data: profile }, { data: member }] =
    await Promise.all([
      fetchShipmentPortalOperatorRow(userClient, shipmentId),
      fetchShipmentParticipantForUser(userClient, shipmentId, userId),
      userClient.from("profiles").select("role").eq("id", userId).maybeSingle(),
      userClient
        .from("organization_members")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (!ship) return false;
  if ((profile?.role as string | undefined) === "superadmin") return true;
  if ((ship.assignee_user_id as string | null) === userId) return true;
  if (participant) return true;
  if (member?.role === "admin") return true;
  return false;
}

export async function resolveCustomerAccessRequest(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
  input: { access_request_id: string; action: "approve" | "deny" },
): Promise<{ ok: true } & ResolveCustomerAccessRequestResponse | Err> {
  const requestId = input.access_request_id.trim();
  const action = input.action;
  if (!requestId || !UUID_RE.test(requestId)) {
    return { ok: false, status: 400, error: "Invalid access_request_id" };
  }
  if (action !== "approve" && action !== "deny") {
    return { ok: false, status: 400, error: "action must be approve or deny" };
  }

  const { data: request, error: reqErr } = await fetchAccessRequestById(admin, requestId);
  if (reqErr) throw reqErr;
  if (!request) return { ok: false, status: 404, error: "Access request not found" };
  if (request.status !== "pending") {
    return { ok: false, status: 409, error: "Request already resolved" };
  }

  const shipmentId = request.shipment_id as string;
  const orgId = request.organization_id as string;

  const allowed = await userCanResolveAccessRequest(userClient, admin, userId, shipmentId, orgId);
  if (!allowed) return { ok: false, status: 403, error: "Not allowed to resolve this request" };

  if (action === "deny") {
    await updateAccessRequest(admin, requestId, {
      status: "denied",
      resolved_at: new Date().toISOString(),
      resolved_by_user_id: userId,
    });
    await resolveAccessRequestAlerts(admin, requestId, {
      decision: "denied",
      resolvedByUserId: userId,
    });
    return { ok: true, status: "denied", shipment_id: shipmentId };
  }

  const email = String(request.requester_email).trim().toLowerCase();
  const inviteResult = await createCustomerInvite(userClient, admin, userId, {
    organization_id: orgId,
    shipment_id: shipmentId,
    invited_email: email,
    delivery_mode: "email_invite",
  });
  if (!inviteResult.ok) {
    return { ok: false, status: inviteResult.status, error: inviteResult.error };
  }

  const { data: existingProfile } = await fetchProfileIdByEmail(admin, email);
  if (existingProfile?.id && inviteResult.token) {
    await acceptCustomerInvite(admin, existingProfile.id as string, email, inviteResult.token);
  }

  await updateAccessRequest(admin, requestId, {
    status: "approved",
    resolved_at: new Date().toISOString(),
    resolved_by_user_id: userId,
    invite_id: inviteResult.invite_id,
  });

  await resolveAccessRequestAlerts(admin, requestId, {
    decision: "approved",
    resolvedByUserId: userId,
  });

  return {
    ok: true,
    status: "approved",
    shipment_id: shipmentId,
    invite_id: inviteResult.invite_id,
  };
}

// ---------------------------------------------------------------------------
// preview-customer-invite (anonymous)
// ---------------------------------------------------------------------------

export async function previewCustomerInvite(
  admin: SupabaseClient,
  token: string,
): Promise<{ ok: true } & PreviewCustomerInviteResponse | Err> {
  if (!token.trim()) return { ok: false, status: 400, error: "token required" };

  const tokenHash = await sha256Hex(token.trim());
  const { data: invite, error: invErr } = await fetchCustomerInviteByTokenHash(admin, tokenHash);
  if (invErr) throw invErr;
  if (!invite) return { ok: false, status: 404, error: "Invalid or expired invite" };
  if (invite.status !== "pending") {
    return { ok: false, status: 410, error: "Invite is no longer valid" };
  }
  if (new Date(invite.expires_at as string) < new Date()) {
    return { ok: false, status: 410, error: "This invite has expired" };
  }

  const orgId = invite.organization_id as string;
  const shipmentId = invite.shipment_id as string;
  const email = String(invite.invited_email).trim().toLowerCase();
  const masked = email.replace(/(^.).*(@.*$)/, "$1***$2");

  const { data: orgRow } = await fetchOrganizationForPortal(admin, orgId);
  const { data: ship } = await admin
    .from("shipments")
    .select("order_number, container_number")
    .eq("id", shipmentId)
    .maybeSingle();

  const order = (ship?.order_number as string | null | undefined)?.trim();
  const container = (ship?.container_number as string | null | undefined)?.trim();
  const shipmentLabel = order ? `Order ${order}` : container ? `Container ${container}` : "this shipment";

  return {
    ok: true,
    invited_email: email,
    invited_email_masked: masked,
    org_name: (orgRow?.name as string | undefined) ?? "Your logistics team",
    shipment_label: shipmentLabel,
    shipment_id: shipmentId,
  };
}
