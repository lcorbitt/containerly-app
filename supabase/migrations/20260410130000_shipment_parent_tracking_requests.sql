-- Shipment metadata: BOL, JSONCargo carrier line, BOL batch id.
-- Hierarchy: shipments -> containers (containers.shipment_id) -> tracking_requests (sync/workflow per container).

alter table public.shipments
  add column if not exists bill_of_lading text,
  add column if not exists shipping_line text,
  add column if not exists shipment_group_id uuid;

comment on table public.shipments is
  'Commercial shipment or move (often one BOL). Owns physical container rows; tracking_requests attach to a container for sync and operator workflow.';

comment on column public.shipments.bill_of_lading is
  'Carrier bill of lading; JSONCargo GET /containers/bol/{bill_of_lading_number}.';

comment on column public.shipments.shipping_line is
  'JSONCargo shipping_line query param when the container prefix is ambiguous (MAERSK, MSC, …).';

comment on column public.shipments.shipment_group_id is
  'Shared batch id for rows created in one BOL import; at most one shipment row per (org, group).';

create unique index if not exists shipments_org_shipment_group_uidx
  on public.shipments (organization_id, shipment_group_id)
  where shipment_group_id is not null;

-- Remove legacy links superseded by containers.shipment_id (idempotent for fresh installs).
alter table public.tracking_requests drop constraint if exists tracking_requests_shipment_id_fkey;
drop index if exists public.idx_tracking_requests_org_shipment;
alter table public.tracking_requests drop column if exists shipment_id;

alter table public.shipments drop constraint if exists shipments_container_id_fkey;
drop index if exists public.idx_shipments_container;
alter table public.shipments drop column if exists container_id;
