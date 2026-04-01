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
  role: "owner" | "admin" | "member";
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
