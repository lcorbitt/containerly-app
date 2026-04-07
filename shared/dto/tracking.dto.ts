/**
 * DTOs for container tracking Edge Functions:
 * - create-tracking-request
 * - sync-container
 * - get-container-details
 * - search-containers
 * - lookup-bol-containers
 */

// ---------------------------------------------------------------------------
// create-tracking-request
// ---------------------------------------------------------------------------

export type CreateTrackingRequestBody = {
  organization_id: string;
  container_number: string;
  run_sync?: boolean;
  shipment_group_id?: string | null;
  source_bill_of_lading?: string | null;
  shipping_line?: string | null;
  shipment_id?: string | null;
  shipment_reference?: string | null;
};

export type CreateTrackingRequestResponse = {
  tracking_request: Record<string, unknown>;
  sync_error?: string;
};

// ---------------------------------------------------------------------------
// sync-container
// ---------------------------------------------------------------------------

export type SyncContainerBody = {
  organization_id: string;
  container_number?: string;
  container_id?: string;
  tracking_request_id?: string;
  force?: boolean;
};

export type SyncContainerResponse = {
  container: Record<string, unknown>;
  refreshed: boolean;
  provider?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// get-container-details (GET ?organization_id=&container_id=|number=&force=)
// ---------------------------------------------------------------------------

export type GetContainerDetailsParams = {
  organization_id: string;
  container_id?: string;
  number?: string;
  force?: "1";
};

export type GetContainerDetailsResponse = {
  container: Record<string, unknown>;
  refreshed: boolean;
  normalized?: string;
};

// ---------------------------------------------------------------------------
// search-containers
// ---------------------------------------------------------------------------

export type SearchContainersBody = {
  organization_id: string;
  q: string;
};

export type SearchContainerRow = {
  id: string;
  container_number: string;
  normalized_number: string;
  carrier: string | null;
  status: string | null;
  last_synced_at: string | null;
};

export type SearchContainersResponse = {
  results: SearchContainerRow[];
};

// ---------------------------------------------------------------------------
// lookup-bol-containers
// ---------------------------------------------------------------------------

export type LookupBolContainersBody = {
  organization_id: string;
  bill_of_lading: string;
  shipping_line?: string;
};

export type LookupBolContainersResponse = {
  bill_of_lading: string;
  shipping_line_name: string | null;
  shipping_line_id: string | null;
  shipping_line: string | null;
  associated_container_numbers: string[];
};
