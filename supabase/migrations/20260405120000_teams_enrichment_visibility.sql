-- Plan: operator assignee/watchers, container enrichment (AIS/vessel/ports), customer visibility keys.

-- ---------------------------------------------------------------------------
-- containers.enrichment — JSONCargo extras (vessel AIS, specs, port hints)
-- ---------------------------------------------------------------------------

alter table public.containers
  add column if not exists enrichment jsonb not null default '{}'::jsonb;

comment on column public.containers.enrichment is
  'Provider extras: vessel_ais, vessel_specs, vessel_finder, ports, source_last_fetched_at (mock/real JSONCargo).';

-- ---------------------------------------------------------------------------
-- tracking_requests.assignee
-- ---------------------------------------------------------------------------

alter table public.tracking_requests
  add column if not exists assignee_user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_tracking_requests_assignee
  on public.tracking_requests (organization_id, assignee_user_id)
  where assignee_user_id is not null;

-- ---------------------------------------------------------------------------
-- tracking_request_watchers
-- ---------------------------------------------------------------------------

create table public.tracking_request_watchers (
  id uuid primary key default gen_random_uuid(),
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tracking_request_id, user_id)
);

create index idx_tracking_request_watchers_request
  on public.tracking_request_watchers (tracking_request_id);

create index idx_tracking_request_watchers_user
  on public.tracking_request_watchers (user_id);

alter table public.tracking_request_watchers enable row level security;

create policy "tracking_request_watchers_select"
  on public.tracking_request_watchers for select
  to authenticated
  using (
    exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_watchers.tracking_request_id
        and public.is_org_member(tr.organization_id)
    )
  );

create policy "tracking_request_watchers_insert"
  on public.tracking_request_watchers for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_watchers.tracking_request_id
        and public.is_org_member(tr.organization_id)
    )
  );

create policy "tracking_request_watchers_delete"
  on public.tracking_request_watchers for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_watchers.tracking_request_id
        and public.is_org_member(tr.organization_id)
    )
  );
