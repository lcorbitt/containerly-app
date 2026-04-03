/** Global account type: platform operator (RLS bypass) vs normal user. */
export type ProfileRole = "user" | "superadmin";

export type Profile = {
  id: string;
  email: string | null;
  /** From Supabase user_metadata at signup; editable via auth.updateUser metadata sync. */
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
};

/** Tenant-scoped role in organization_members (separate from profiles.superadmin). */
export type OrganizationMemberRole = "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  slug: string;
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

export type Container = {
  id: string;
  organization_id: string;
  container_number: string;
  normalized_number: string;
  carrier: string | null;
  status: string | null;
  location: Record<string, unknown> | null;
  last_synced_at: string | null;
  last_checked_at: string | null;
};

export type TrackingRequest = {
  id: string;
  organization_id: string;
  created_by: string;
  container_id: string | null;
  container_number: string;
  normalized_number: string;
  status: string;
  last_sync_at: string | null;
  next_check_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type Alert = {
  id: string;
  organization_id: string;
  tracking_request_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  acknowledged_at: string | null;
  created_at: string;
};

export type SharedReport = {
  id: string;
  organization_id: string;
  tracking_request_id: string;
  created_by: string;
  title: string | null;
  settings: Record<string, unknown>;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportMessage = {
  id: string;
  organization_id: string;
  tracking_request_id: string;
  author_user_id: string | null;
  author_kind: string;
  is_internal: boolean;
  author_display_name: string | null;
  body: string;
  parent_message_id: string | null;
  created_at: string;
};

export type ReportActivity = {
  id: string;
  organization_id: string;
  tracking_request_id: string;
  shared_report_id: string | null;
  actor_user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type TrackingRequestAttachment = {
  id: string;
  organization_id: string;
  tracking_request_id: string;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  file_size_bytes: number;
  uploaded_by: string;
  /** When set, file was posted with this thread message (still listed in Documents). */
  report_message_id: string | null;
  created_at: string;
};
