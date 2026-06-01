-- Commercial export fields on shipments + order/booking line items (shipment_lines).

-- ---------------------------------------------------------------------------
-- 1. Workflow status enum
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.shipment_workflow_status as enum (
    'draft',
    'awaiting_review',
    'revisions_needed',
    'approved',
    'mailed',
    'in_transit'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Extend shipments with commercial header fields
-- ---------------------------------------------------------------------------

alter table public.shipments
  add column if not exists customer_name text,
  add column if not exists country text,
  add column if not exists port_of_loading text,
  add column if not exists port_of_destination text,
  add column if not exists estimated_departure_at timestamptz,
  add column if not exists estimated_arrival_at timestamptz,
  add column if not exists freight_booking_carrier text,
  add column if not exists vessel text,
  add column if not exists voyage text,
  add column if not exists health_certificate_no text,
  add column if not exists trade_terms text,
  add column if not exists physical_mail_tracking_number text,
  add column if not exists physical_mail_sent_at timestamptz,
  add column if not exists workflow_status public.shipment_workflow_status not null default 'draft';

comment on column public.shipments.workflow_status is
  'Documentation workflow lifecycle; separate from carrier tracking status.';

-- ---------------------------------------------------------------------------
-- 3. shipment_lines — order/booking line items
-- ---------------------------------------------------------------------------

create table if not exists public.shipment_lines (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  container_id uuid references public.containers (id) on delete set null,
  container_number text,
  order_number text,
  carrier_booking_number text,
  customer_name text,
  country text,
  port_of_loading text,
  port_of_destination text,
  estimated_departure_at timestamptz,
  estimated_arrival_at timestamptz,
  freight_booking_carrier text,
  vessel text,
  voyage text,
  health_certificate_no text,
  trade_terms text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipment_lines_shipment
  on public.shipment_lines (shipment_id, sort_order);

create index if not exists idx_shipment_lines_container
  on public.shipment_lines (container_id)
  where container_id is not null;

comment on table public.shipment_lines is
  'Order/booking line items; multiple lines per container; multiple containers per shipment.';

-- org_id from shipment
create or replace function public.shipment_lines_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select s.organization_id
  into new.organization_id
  from public.shipments s
  where s.id = new.shipment_id;

  if new.organization_id is null then
    raise exception 'shipment not found for shipment_lines.shipment_id';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists shipment_lines_before_write on public.shipment_lines;
create trigger shipment_lines_before_write
  before insert or update on public.shipment_lines
  for each row execute function public.shipment_lines_set_org();

-- ---------------------------------------------------------------------------
-- 4. RLS for shipment_lines
-- ---------------------------------------------------------------------------

alter table public.shipment_lines enable row level security;

create policy "shipment_lines_select_org"
  on public.shipment_lines for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "shipment_lines_select_customer"
  on public.shipment_lines for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      where s.shipment_id = shipment_lines.shipment_id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

create policy "shipment_lines_insert"
  on public.shipment_lines for insert
  to authenticated
  with check (public.is_org_member(organization_id));

create policy "shipment_lines_update"
  on public.shipment_lines for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "shipment_lines_delete"
  on public.shipment_lines for delete
  to authenticated
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 5. Backfill existing shipments with one line from primary container
-- ---------------------------------------------------------------------------

insert into public.shipment_lines (
  shipment_id,
  organization_id,
  container_id,
  container_number,
  order_number,
  carrier_booking_number,
  sort_order
)
select
  s.id,
  s.organization_id,
  c.id,
  c.container_number,
  s.reference,
  s.bill_of_lading,
  0
from public.shipments s
left join lateral (
  select c2.id, c2.container_number
  from public.containers c2
  where c2.shipment_id = s.id
  order by c2.created_at asc nulls last
  limit 1
) c on true
where not exists (
  select 1 from public.shipment_lines sl where sl.shipment_id = s.id
);
