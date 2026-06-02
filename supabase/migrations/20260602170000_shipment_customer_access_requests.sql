-- Pending customer access requests (portal gate); resolved via Edge only.

create table public.shipment_customer_access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  requester_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references auth.users (id) on delete set null,
  invite_id uuid references public.customer_invites (id) on delete set null,
  access_id uuid references public.shipment_customer_access (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index shipment_customer_access_requests_pending_unique
  on public.shipment_customer_access_requests (shipment_id, lower(requester_email))
  where status = 'pending';

create index idx_shipment_customer_access_requests_shipment
  on public.shipment_customer_access_requests (shipment_id, status);

alter table public.shipment_customer_access_requests enable row level security;

create policy shipment_customer_access_requests_select_org_member
  on public.shipment_customer_access_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipments s
      inner join public.organization_members om on om.organization_id = s.organization_id
      where s.id = shipment_customer_access_requests.shipment_id
        and om.user_id = auth.uid()
    )
  );

comment on table public.shipment_customer_access_requests is
  'Customer portal access requests from unauthenticated email gate; approve/deny via Edge.';
