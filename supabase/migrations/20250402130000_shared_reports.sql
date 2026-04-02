-- Shared customer reports + org-scoped messages + lightweight activity audit.
-- Public reads go through Edge Functions (service role); no anonymous RLS on fact tables.

-- ---------------------------------------------------------------------------
-- shared_reports: public link anchor (URL uses id)
-- ---------------------------------------------------------------------------

create table public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text,
  settings jsonb not null default jsonb_build_object(
    'include_raw_external', false,
    'include_alerts', true
  ),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.shared_reports_align_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tr_org uuid;
begin
  select organization_id into tr_org
  from public.tracking_requests
  where id = new.tracking_request_id;

  if tr_org is null then
    raise exception 'tracking_request not found';
  end if;

  if new.organization_id is distinct from tr_org then
    raise exception 'organization_id must match tracking_request.organization_id';
  end if;

  return new;
end;
$$;

create trigger shared_reports_before_write
  before insert or update of organization_id, tracking_request_id on public.shared_reports
  for each row execute function public.shared_reports_align_org();

create index idx_shared_reports_org on public.shared_reports (organization_id);
create index idx_shared_reports_tracking on public.shared_reports (tracking_request_id);
create index idx_shared_reports_active
  on public.shared_reports (id)
  where revoked_at is null;

create trigger shared_reports_updated_at
  before update on public.shared_reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- report_messages: thread on tracking_request (internal vs customer-visible)
-- ---------------------------------------------------------------------------

create table public.report_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  author_kind text not null default 'member'
    check (author_kind in ('member', 'customer', 'system')),
  is_internal boolean not null default false,
  author_display_name text,
  body text not null check (char_length(body) > 0 and char_length(body) <= 8000),
  created_at timestamptz not null default now()
);

create index idx_report_messages_request on public.report_messages (tracking_request_id, created_at desc);
create index idx_report_messages_org on public.report_messages (organization_id);

create or replace function public.report_messages_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select organization_id
  into new.organization_id
  from public.tracking_requests
  where id = new.tracking_request_id;

  if new.organization_id is null then
    raise exception 'tracking_request not found';
  end if;

  return new;
end;
$$;

create trigger report_messages_before_insert
  before insert on public.report_messages
  for each row execute function public.report_messages_set_org();

-- ---------------------------------------------------------------------------
-- report_activity: audit (org members read; writes via members or service role)
-- ---------------------------------------------------------------------------

create table public.report_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  shared_report_id uuid references public.shared_reports (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_report_activity_request on public.report_activity (tracking_request_id, created_at desc);
create index idx_report_activity_org on public.report_activity (organization_id);

create or replace function public.report_activity_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select organization_id
  into new.organization_id
  from public.tracking_requests
  where id = new.tracking_request_id;

  if new.organization_id is null then
    raise exception 'tracking_request not found';
  end if;

  return new;
end;
$$;

create trigger report_activity_before_insert
  before insert on public.report_activity
  for each row execute function public.report_activity_set_org();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.shared_reports enable row level security;
alter table public.report_messages enable row level security;
alter table public.report_activity enable row level security;

-- shared_reports
create policy "shared_reports_select"
  on public.shared_reports for select
  using (public.is_org_member(organization_id));

create policy "shared_reports_insert"
  on public.shared_reports for insert
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_id
        and tr.organization_id = shared_reports.organization_id
    )
  );

create policy "shared_reports_update"
  on public.shared_reports for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "shared_reports_delete"
  on public.shared_reports for delete
  using (public.has_org_role(organization_id, array['admin']));

-- report_messages (customer posts use service role — bypasses RLS)
create policy "report_messages_select"
  on public.report_messages for select
  using (public.is_org_member(organization_id));

create policy "report_messages_insert_member"
  on public.report_messages for insert
  with check (
    public.is_org_member(organization_id)
    and author_kind = 'member'
    and author_user_id = auth.uid()
  );

-- report_activity
create policy "report_activity_select"
  on public.report_activity for select
  using (public.is_org_member(organization_id));

create policy "report_activity_insert_member"
  on public.report_activity for insert
  with check (
    public.is_org_member(organization_id)
    and actor_user_id = auth.uid()
  );
