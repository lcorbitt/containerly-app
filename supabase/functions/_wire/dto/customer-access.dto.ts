/**
 * DTOs for customer/importer access Edge Functions:
 * - create-customer-invite
 * - accept-customer-invite
 * - complete-customer-shipment-setup
 * - post-customer-shipment-message
 */

// ---------------------------------------------------------------------------
// create-customer-invite
// ---------------------------------------------------------------------------

export type CreateCustomerInviteBody = {
  organization_id: string;
  shipment_id: string;
  invited_email: string;
  visibility_settings?: Record<string, unknown>;
  delivery_mode?: "email_invite" | "allowlist_only";
};

export type CreateCustomerInviteResponse = {
  invite_id: string;
  invite_url: string;
  expires_at: string;
  token: string;
  visibility_settings: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// accept-customer-invite
// ---------------------------------------------------------------------------

export type AcceptCustomerInviteBody = {
  token: string;
};

export type AcceptCustomerInviteResponse = {
  shipment_id: string;
  shipment_access_id: string;
  already_had_access?: boolean;
};

export type ClaimShipmentAccessBody = {
  shipment_id: string;
};

export type ClaimShipmentAccessResponse = {
  access_id: string;
  shipment_id: string;
  already_had_access?: boolean;
};

// ---------------------------------------------------------------------------
// complete-customer-shipment-setup
// ---------------------------------------------------------------------------

export type CompleteCustomerSetupBody = {
  shipment_id: string;
};

export type CompleteCustomerSetupResponse = {
  ok: true;
  profile_completed_at: string;
};

// ---------------------------------------------------------------------------
// post-customer-shipment-message
// ---------------------------------------------------------------------------

export type PostCustomerMessageBody = {
  shipment_id: string;
  container_id?: string;
  body: string;
  author_display_name?: string;
  parent_message_id?: string | null;
};

export type PostCustomerMessageResponse = {
  message: {
    id: string;
    body: string;
    author_display_name: string | null;
    created_at: string;
    author_kind: string;
  };
};

// ---------------------------------------------------------------------------
// check-portal-access-email (anonymous)
// ---------------------------------------------------------------------------

export type CheckPortalAccessEmailBody = {
  shipment_id: string;
  email: string;
};

export type CheckPortalAccessEmailResponse = {
  message: string;
  outcome: "signed_in" | "request_sent" | "already_requested";
  /** Present when outcome is `signed_in`: one-time OTP the browser verifies to establish a session. */
  token_hash?: string;
  token_type?: "magiclink";
};

// ---------------------------------------------------------------------------
// resolve-customer-access-request
// ---------------------------------------------------------------------------

export type ResolveCustomerAccessRequestBody = {
  access_request_id: string;
  action: "approve" | "deny";
};

export type ResolveCustomerAccessRequestResponse = {
  ok: true;
  status: "approved" | "denied";
  shipment_id: string;
  invite_id?: string;
};

// ---------------------------------------------------------------------------
// preview-customer-invite (anonymous)
// ---------------------------------------------------------------------------

export type PreviewCustomerInviteBody = {
  token: string;
};

export type PreviewCustomerInviteResponse = {
  /** Full address; safe to return only when caller holds the invite token. */
  invited_email: string;
  invited_email_masked: string;
  org_name: string;
  shipment_label: string;
  /** Shipment id for this invite; used to request a passwordless sign-in link. */
  shipment_id: string;
};
