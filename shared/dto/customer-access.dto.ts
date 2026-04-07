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
