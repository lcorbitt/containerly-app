/** Global account type: platform operator (RLS bypass) vs normal user. */
export type ProfileRole = "user" | "superadmin";

export type Profile = {
  id: string;
  email: string | null;
  /** From Supabase user_metadata at signup; editable via auth.updateUser metadata sync. */
  full_name: string | null;
  /** Storage object path in bucket `profile-images` (public URL via getPublicUrl). */
  profile_image_path: string | null;
  role: ProfileRole;
  /** `customer` when the user only receives shipment grants (no freight org membership). */
  account_kind?: "operator" | "customer";
  created_at: string;
};

/** Tenant-scoped role in organization_members (separate from profiles.superadmin). */
export type OrganizationMemberRole = "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  /** Object path in bucket `org-images` (first segment = organization id). */
  org_image_path?: string | null;
  /** Self-reported team size band from sign-up onboarding. */
  team_size?: string | null;
  /** Self-reported monthly shipment volume band from sign-up onboarding. */
  monthly_shipment_volume?: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  created_at: string;
};

/** Commercial shipment / move (often one BOL); owns `containers` rows (containers.shipment_id). */
export type Shipment = {
  id: string;
  organization_id: string;
  /** Org member who owns this shipment (containers and tracking lines are grouped under it). */
  created_by?: string | null;
  /** Primary commercial identifier (PO / order no.). */
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  status: string | null;
  metadata: Record<string, unknown> | null;
  /** Carrier BOL; JSONCargo `/containers/bol/{bill_of_lading_number}`. */
  bill_of_lading?: string | null;
  /** JSONCargo `shipping_line` when prefix is ambiguous. */
  shipping_line?: string | null;
  /** Batch id from BOL import; unique per org on `shipments`. */
  shipment_group_id?: string | null;
  /** Primary operator for triage (defaults to `created_by` on insert). */
  assignee_user_id?: string | null;
  customer_name?: string | null;
  consignee?: string | null;
  country?: string | null;
  port_of_loading?: string | null;
  port_of_destination?: string | null;
  estimated_departure_at?: string | null;
  estimated_arrival_at?: string | null;
  freight_booking_carrier?: string | null;
  vessel?: string | null;
  voyage?: string | null;
  health_certificate_no?: string | null;
  trade_terms?: string | null;
  physical_mail_tracking_number?: string | null;
  physical_mail_sent_at?: string | null;
  workflow_status?: string | null;
  /** Operator labels for triage and filtering. */
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ShipmentLine = {
  id: string;
  shipment_id: string;
  organization_id: string;
  container_id: string | null;
  container_number: string | null;
  order_number: string | null;
  carrier_booking_number: string | null;
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
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Container = {
  id: string;
  organization_id: string;
  /** Parent commercial shipment (BOL / booking). */
  shipment_id: string;
  container_number: string;
  normalized_number: string;
  carrier: string | null;
  status: string | null;
  location: Record<string, unknown> | null;
  /** JSONCargo extras: vessel_ais, vessel_specs, port_hint, etc. */
  enrichment?: Record<string, unknown> | null;
  last_synced_at: string | null;
  last_checked_at: string | null;
};

export type TrackingRequest = {
  id: string;
  organization_id: string;
  /** Audit: who created this sync/workflow row; product ownership is `shipments.created_by`. */
  created_by: string;
  container_id: string | null;
  container_number: string;
  normalized_number: string;
  status: string;
  last_sync_at: string | null;
  next_check_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at?: string;
  /** BOL reference if created from BOL import. */
  source_bill_of_lading?: string | null;
  /** Same id for all containers created in one BOL import batch. */
  shipment_group_id?: string | null;
};

/** Org members collaborating on a shipment (many); assignee is `shipments.assignee_user_id`. */
export type ShipmentParticipant = {
  id: string;
  shipment_id: string;
  user_id: string;
  created_at: string;
};

export type Alert = {
  id: string;
  organization_id: string;
  tracking_request_id: string | null;
  container_id: string | null;
  shipment_id: string | null;
  shipment_message_id: string | null;
  inbox_kind?: "notification" | "operational_alert";
  alert_type: string;
  severity: string;
  message: string;
  details: Record<string, unknown> | null;
  recipient_user_id: string | null;
  actor_user_id: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
};

export type SharedReport = {
  id: string;
  organization_id: string;
  shipment_id: string;
  created_by: string;
  title: string | null;
  settings: Record<string, unknown>;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShipmentCustomerAccessRequest = {
  id: string;
  organization_id: string;
  shipment_id: string;
  requester_email: string;
  status: "pending" | "approved" | "denied";
  requested_at: string;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
  invite_id: string | null;
  access_id: string | null;
  created_at: string;
};

export type CustomerInvite = {
  id: string;
  organization_id: string;
  shipment_id: string;
  invited_email: string;
  invited_by_user_id: string;
  token_hash: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by_user_id: string | null;
  visibility_settings: Record<string, unknown>;
  delivery_mode?: "email_invite" | "allowlist_only";
  created_at: string;
};

export type ShipmentCustomerAccess = {
  id: string;
  organization_id: string;
  shipment_id: string;
  customer_user_id: string;
  invite_id: string | null;
  visibility_settings: Record<string, unknown>;
  operator_overrides: Record<string, unknown>;
  configuration_reminder_due_at: string | null;
  profile_completed_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShipmentMessage = {
  id: string;
  organization_id: string;
  /** Set when the thread is scoped to one physical container. */
  container_id: string | null;
  /** Set when the thread is scoped to the whole commercial shipment. */
  shipment_id: string | null;
  author_user_id: string | null;
  author_kind: string;
  is_internal: boolean;
  author_display_name: string | null;
  body: string;
  parent_message_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportActivity = {
  id: string;
  organization_id: string;
  shipment_id: string;
  container_id?: string | null;
  shared_report_id: string | null;
  actor_user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type WorkspaceAttachment = {
  id: string;
  organization_id: string;
  container_id: string | null;
  shipment_id: string | null;
  /** When true, hidden from customer portal and customer storage policies. */
  is_internal: boolean;
  /** Who uploaded: org operator vs customer importer. */
  uploaded_by_kind?: "operator" | "customer" | null;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  file_size_bytes: number;
  uploaded_by: string;
  /** When set, file was posted with this thread message (still listed in Documents). */
  shipment_message_id: string | null;
  document_type?: string | null;
  document_group?: string | null;
  approval_status?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  shipment_line_id?: string | null;
  created_at: string;
};

/** @deprecated use WorkspaceAttachment */
export type ContainerAttachment = WorkspaceAttachment;

/** @deprecated use WorkspaceAttachment */
export type TrackingRequestAttachment = WorkspaceAttachment;
