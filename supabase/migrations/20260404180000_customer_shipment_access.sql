-- Authenticated customer access (invites + grants). Anonymous public report URLs are deprecated.
-- ---------------------------------------------------------------------------
-- profiles.account_kind
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists account_kind text not null default 'operator'
    check (account_kind in ('operator', 'customer'));

-- ---------------------------------------------------------------------------
-- customer_invites (pending invite; token stored as SHA-256 hex only)
-- ---------------------------------------------------------------------------

create table public.customer_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  invited_email text not null,
  invited_by_user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users (id) on delete set null,
  visibility_settings jsonb not null default jsonb_build_object(
    'include_raw_external', false,
    'include_alerts', true
  ),
  created_at timestamptz not null default now()
);

create index idx_customer_invites_tracking on public.customer_invites (tracking_request_id);
create index idx_customer_invites_org on public.customer_invites (organization_id);
create index idx_customer_invites_pending on public.customer_invites (organization_id, tracking_request_id)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- shipment_customer_access (active grant after accept)
-- ---------------------------------------------------------------------------

create table public.shipment_customer_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  customer_user_id uuid not null references auth.users (id) on delete cascade,
  invite_id uuid references public.customer_invites (id) on delete set null,
  visibility_settings jsonb not null default jsonb_build_object(
    'include_raw_external', false,
    'include_alerts', true
  ),
  operator_overrides jsonb not null default '{}'::jsonb,
  configuration_reminder_due_at timestamptz,
  profile_completed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index shipment_customer_access_active_unique
  on public.shipment_customer_access (tracking_request_id, customer_user_id)
  where revoked_at is null;

create index idx_shipment_customer_access_customer
  on public.shipment_customer_access (customer_user_id)
  where revoked_at is null;

create or replace function public.shipment_customer_access_set_org()
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

create trigger shipment_customer_access_before_write
  before insert or update of tracking_request_id
  on public.shipment_customer_access
  for each row execute function public.shipment_customer_access_set_org();

create trigger shipment_customer_access_updated_at
  before update on public.shipment_customer_access
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- report_activity: optional link to access grant
-- ---------------------------------------------------------------------------

alter table public.report_activity
  add column if not exists shipment_customer_access_id uuid
    references public.shipment_customer_access (id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS helper: customer has non-revoked access to a tracking request
-- ---------------------------------------------------------------------------

create or replace function public.customer_has_shipment_access(p_tracking_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shipment_customer_access s
    where s.tracking_request_id = p_tracking_request_id
      and s.customer_user_id = auth.uid()
      and s.revoked_at is null
  );
$$;

grant execute on function public.customer_has_shipment_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- profiles: customers may update own row (display name / complete profile)
-- ---------------------------------------------------------------------------

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Org members visible to customers who have any grant with that org (message author names)
create policy "profiles_select_for_shipment_customer"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      join public.tracking_requests tr on tr.id = s.tracking_request_id
      join public.organization_members om
        on om.organization_id = tr.organization_id
        and om.user_id = public.profiles.id
      where s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- customer_invites RLS
-- ---------------------------------------------------------------------------

alter table public.customer_invites enable row level security;

create policy "customer_invites_select_org"
  on public.customer_invites for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "customer_invites_insert_org"
  on public.customer_invites for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and invited_by_user_id = auth.uid()
  );

create policy "customer_invites_update_org"
  on public.customer_invites for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- shipment_customer_access RLS (insert via service role / Edge only)
-- ---------------------------------------------------------------------------

alter table public.shipment_customer_access enable row level security;

create policy "shipment_customer_access_select"
  on public.shipment_customer_access for select
  to authenticated
  using (
    public.is_org_member(organization_id)
    or (
      customer_user_id = auth.uid()
      and revoked_at is null
    )
  );

create policy "shipment_customer_access_update_org"
  on public.shipment_customer_access for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Fact tables: customer read paths
-- ---------------------------------------------------------------------------

create policy "organizations_select_customer"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      join public.tracking_requests tr on tr.id = s.tracking_request_id
      where tr.organization_id = organizations.id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

create policy "tr_select_customer"
  on public.tracking_requests for select
  to authenticated
  using (public.customer_has_shipment_access(id));

create policy "containers_select_customer"
  on public.containers for select
  to authenticated
  using (
    exists (
      select 1
      from public.tracking_requests tr
      join public.shipment_customer_access s on s.tracking_request_id = tr.id
      where tr.container_id = containers.id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

create policy "te_select_customer"
  on public.tracking_events for select
  to authenticated
  using (public.customer_has_shipment_access(tracking_request_id));

create policy "alerts_select_customer"
  on public.alerts for select
  to authenticated
  using (
    tracking_request_id is not null
    and public.customer_has_shipment_access(tracking_request_id)
  );

create policy "report_messages_select_customer"
  on public.report_messages for select
  to authenticated
  using (
    public.customer_has_shipment_access(tracking_request_id)
    and is_internal = false
  );

create policy "report_messages_insert_customer"
  on public.report_messages for insert
  to authenticated
  with check (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and public.customer_has_shipment_access(tracking_request_id)
  );

create policy "tracking_request_attachments_select_customer"
  on public.tracking_request_attachments for select
  to authenticated
  using (public.customer_has_shipment_access(tracking_request_id));

-- ---------------------------------------------------------------------------
-- Storage: customers may read files for granted tracking requests
-- ---------------------------------------------------------------------------

create policy "tracking_request_files_select_customer"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.customer_has_shipment_access((split_part(name, '/', 2))::uuid)
  );
