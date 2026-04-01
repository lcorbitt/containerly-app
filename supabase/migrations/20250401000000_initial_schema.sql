-- Containerly: logistics SaaS core schema + RLS
-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.containers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  container_number text not null,
  normalized_number text not null,
  carrier text,
  status text,
  location jsonb,
  raw_external jsonb,
  last_synced_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, normalized_number)
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  container_id uuid references public.containers (id) on delete set null,
  reference text not null,
  status text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracking_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  container_id uuid references public.containers (id) on delete set null,
  container_number text not null,
  normalized_number text not null,
  status text not null default 'pending'
    check (status in ('pending', 'syncing', 'active', 'completed', 'failed')),
  last_sync_at timestamptz,
  next_check_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  container_id uuid references public.containers (id) on delete set null,
  event_type text not null,
  status text,
  location jsonb,
  occurred_at timestamptz not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid references public.tracking_requests (id) on delete set null,
  container_id uuid references public.containers (id) on delete set null,
  alert_type text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  message text not null,
  details jsonb default '{}'::jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.external_api_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  function_name text not null,
  endpoint text,
  request_payload jsonb,
  response_status int,
  response_body jsonb,
  duration_ms int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index idx_containers_org_normalized on public.containers (organization_id, normalized_number);
create index idx_containers_org_status on public.containers (organization_id, status);
create index idx_shipments_org on public.shipments (organization_id);
create index idx_shipments_container on public.shipments (container_id);
create index idx_tracking_requests_org_status on public.tracking_requests (organization_id, status);
create index idx_tracking_requests_next_check on public.tracking_requests (next_check_at) where status in ('pending', 'syncing', 'active');
create index idx_tracking_events_request on public.tracking_events (tracking_request_id, occurred_at desc);
create index idx_tracking_events_org on public.tracking_events (organization_id);
create index idx_alerts_org on public.alerts (organization_id, created_at desc);
create index idx_external_api_logs_created on public.external_api_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger containers_updated_at
  before update on public.containers
  for each row execute function public.set_updated_at();

create trigger shipments_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

create trigger tracking_requests_updated_at
  before update on public.tracking_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Denormalize organization_id on tracking_events from parent request
-- ---------------------------------------------------------------------------

create or replace function public.tracking_events_set_org()
returns trigger
language plpgsql
as $$
begin
  select organization_id, container_id
  into new.organization_id, new.container_id
  from public.tracking_requests
  where id = new.tracking_request_id;

  if new.organization_id is null then
    raise exception 'tracking_request not found';
  end if;

  return new;
end;
$$;

create trigger tracking_events_before_insert
  before insert on public.tracking_events
  for each row execute function public.tracking_events_set_org();

-- ---------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER to avoid recursive policy checks)
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(_organization_id uuid, _roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = _organization_id
      and m.user_id = auth.uid()
      and (_roles is null or m.role = any (_roles))
  );
$$;

create or replace function public.has_org_role(_organization_id uuid, _roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = _organization_id
      and m.user_id = auth.uid()
      and m.role = any (_roles)
  );
$$;

grant execute on function public.is_org_member(uuid, text[]) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Bootstrap: create org + owner membership (client-callable)
-- ---------------------------------------------------------------------------

create or replace function public.create_organization(org_name text, org_slug text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  s text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  s := coalesce(
    nullif(trim(org_slug), ''),
    lower(regexp_replace(trim(org_name), '[^a-zA-Z0-9]+', '-', 'g'))
  );

  if s = '' or s is null then
    raise exception 'invalid slug';
  end if;

  insert into public.organizations (name, slug)
  values (trim(org_name), s)
  returning id into new_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

grant execute on function public.create_organization(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.containers enable row level security;
alter table public.shipments enable row level security;
alter table public.tracking_requests enable row level security;
alter table public.tracking_events enable row level security;
alter table public.alerts enable row level security;
alter table public.external_api_logs enable row level security;

-- organizations
create policy "org_select_member"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "org_update_admin"
  on public.organizations for update
  using (public.has_org_role(id, array['owner', 'admin']));

-- organization_members: visible to org members; mutations via service role / future RPCs
create policy "org_members_select"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

-- containers
create policy "containers_select"
  on public.containers for select
  using (public.is_org_member(organization_id));

create policy "containers_insert"
  on public.containers for insert
  with check (public.is_org_member(organization_id));

create policy "containers_update"
  on public.containers for update
  using (public.is_org_member(organization_id));

create policy "containers_delete"
  on public.containers for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- shipments
create policy "shipments_select"
  on public.shipments for select
  using (public.is_org_member(organization_id));

create policy "shipments_insert"
  on public.shipments for insert
  with check (public.is_org_member(organization_id));

create policy "shipments_update"
  on public.shipments for update
  using (public.is_org_member(organization_id));

create policy "shipments_delete"
  on public.shipments for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- tracking_requests
create policy "tr_select"
  on public.tracking_requests for select
  using (public.is_org_member(organization_id));

create policy "tr_insert"
  on public.tracking_requests for insert
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

create policy "tr_update"
  on public.tracking_requests for update
  using (public.is_org_member(organization_id));

create policy "tr_delete"
  on public.tracking_requests for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- tracking_events
create policy "te_select"
  on public.tracking_events for select
  using (public.is_org_member(organization_id));

create policy "te_insert"
  on public.tracking_events for insert
  with check (public.is_org_member(organization_id));

-- alerts
create policy "alerts_select"
  on public.alerts for select
  using (public.is_org_member(organization_id));

create policy "alerts_update_ack"
  on public.alerts for update
  using (public.is_org_member(organization_id));

-- external_api_logs: no client access (service role only)
create policy "external_logs_deny_all"
  on public.external_api_logs
  for all
  using (false);
