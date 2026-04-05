-- Link multiple tracking_requests that came from the same bill of lading import (or future manual grouping).
-- Domain: one BOL often lists many containers; each container still gets its own sync + events row.

alter table public.tracking_requests
  add column if not exists source_bill_of_lading text null,
  add column if not exists shipment_group_id uuid null;

comment on column public.tracking_requests.source_bill_of_lading is
  'Carrier/document BOL reference when the user created this request from a BOL lookup (optional).';

comment on column public.tracking_requests.shipment_group_id is
  'Shared id for requests created together (e.g. one BOL import batch) so the UI can show sibling containers.';

create index if not exists idx_tracking_requests_org_shipment_group
  on public.tracking_requests (organization_id, shipment_group_id)
  where shipment_group_id is not null;
