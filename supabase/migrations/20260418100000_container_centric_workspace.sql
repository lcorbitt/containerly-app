-- Container-centric timeline, messages, documents; shipment-scoped customer access and shared reports.
-- Fresh reset expected — includes backfills for non-empty dev DBs.

-- ---------------------------------------------------------------------------
-- 1. tracking_events: require container_id; org from container; optional sync audit on tracking_request
-- ---------------------------------------------------------------------------

drop trigger if exists tracking_events_before_insert on public.tracking_events;
drop function if exists public.tracking_events_set_org();

alter table public.tracking_events
  drop constraint if exists tracking_events_tracking_request_id_fkey;

update public.tracking_events te
set container_id = tr.container_id
from public.tracking_requests tr
where te.tracking_request_id = tr.id
  and te.container_id is null
  and tr.container_id is not null;

alter table public.tracking_events
  alter column tracking_request_id drop not null;

alter table public.tracking_events
  add constraint tracking_events_tracking_request_id_fkey
    foreign key (tracking_request_id) references public.tracking_requests (id) on delete set null;

alter table public.tracking_events
  alter column container_id set not null;

create or replace function public.tracking_events_set_org_from_container()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select c.organization_id
  into new.organization_id
  from public.containers c
  where c.id = new.container_id;

  if new.organization_id is null then
    raise exception 'container not found for tracking_events.container_id';
  end if;

  return new;
end;
$$;

create trigger tracking_events_before_insert
  before insert on public.tracking_events
  for each row execute function public.tracking_events_set_org_from_container();

create index if not exists idx_tracking_events_container_occurred
  on public.tracking_events (container_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 2. report_messages: container_id (thread is per physical container)
-- ---------------------------------------------------------------------------

alter table public.report_messages
  add column if not exists container_id uuid references public.containers (id) on delete cascade;

update public.report_messages rm
set container_id = tr.container_id
from public.tracking_requests tr
where rm.tracking_request_id = tr.id
  and rm.container_id is null;

alter table public.report_messages
  alter column container_id set not null;

drop trigger if exists report_messages_validate_parent_trigger on public.report_messages;
drop trigger if exists report_messages_before_insert on public.report_messages;

drop index if exists public.idx_report_messages_request;

-- Policies from customer_shipment_access reference tracking_request_id; drop before column removal.
drop policy if exists "report_messages_select_customer" on public.report_messages;
drop policy if exists "report_messages_insert_customer" on public.report_messages;

alter table public.report_messages
  drop constraint if exists report_messages_tracking_request_id_fkey;

alter table public.report_messages
  drop column if exists tracking_request_id;

create index idx_report_messages_container
  on public.report_messages (container_id, created_at desc);

create or replace function public.report_messages_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select c.organization_id
  into new.organization_id
  from public.containers c
  where c.id = new.container_id;

  if new.organization_id is null then
    raise exception 'container not found';
  end if;

  return new;
end;
$$;

create trigger report_messages_before_insert
  before insert on public.report_messages
  for each row execute function public.report_messages_set_org();

create or replace function public.report_messages_validate_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_container uuid;
begin
  if new.parent_message_id is null then
    return new;
  end if;

  select container_id
  into p_container
  from public.report_messages
  where id = new.parent_message_id;

  if p_container is null then
    raise exception 'parent message not found';
  end if;

  if p_container is distinct from new.container_id then
    raise exception 'parent message belongs to a different container';
  end if;

  return new;
end;
$$;

create trigger report_messages_validate_parent_trigger
  before insert or update of parent_message_id, container_id
  on public.report_messages
  for each row execute function public.report_messages_validate_parent();

-- ---------------------------------------------------------------------------
-- 3. report_activity: shipment-scoped (+ optional container)
-- ---------------------------------------------------------------------------

alter table public.report_activity
  add column if not exists shipment_id uuid references public.shipments (id) on delete cascade;

alter table public.report_activity
  add column if not exists container_id uuid references public.containers (id) on delete set null;

update public.report_activity ra
set
  shipment_id = c.shipment_id,
  container_id = coalesce(ra.container_id, c.id)
from public.tracking_requests tr
join public.containers c on c.id = tr.container_id
where ra.tracking_request_id = tr.id
  and ra.shipment_id is null;

alter table public.report_activity
  alter column shipment_id set not null;

drop trigger if exists report_activity_before_insert on public.report_activity;

alter table public.report_activity
  drop constraint if exists report_activity_tracking_request_id_fkey;

alter table public.report_activity
  drop column if exists tracking_request_id;

drop index if exists public.idx_report_activity_request;

create index idx_report_activity_shipment
  on public.report_activity (shipment_id, created_at desc);

create or replace function public.report_activity_set_org()
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
    raise exception 'shipment not found';
  end if;

  return new;
end;
$$;

create trigger report_activity_before_insert
  before insert on public.report_activity
  for each row execute function public.report_activity_set_org();

-- ---------------------------------------------------------------------------
-- 4. shared_reports: shipment-scoped public links
-- ---------------------------------------------------------------------------

alter table public.shared_reports
  add column if not exists shipment_id uuid references public.shipments (id) on delete cascade;

update public.shared_reports sr
set shipment_id = c.shipment_id
from public.tracking_requests tr
join public.containers c on c.id = tr.container_id
where sr.tracking_request_id = tr.id
  and sr.shipment_id is null;

alter table public.shared_reports
  alter column shipment_id set not null;

drop trigger if exists shared_reports_before_write on public.shared_reports;

drop index if exists public.idx_shared_reports_tracking;

-- shared_reports_insert WITH CHECK references tracking_request_id; drop before column removal.
drop policy if exists "shared_reports_insert" on public.shared_reports;

alter table public.shared_reports
  drop constraint if exists shared_reports_tracking_request_id_fkey;

alter table public.shared_reports
  drop column if exists tracking_request_id;

create index idx_shared_reports_shipment
  on public.shared_reports (shipment_id);

create or replace function public.shared_reports_align_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sh_org uuid;
begin
  select organization_id into sh_org
  from public.shipments
  where id = new.shipment_id;

  if sh_org is null then
    raise exception 'shipment not found';
  end if;

  if new.organization_id is distinct from sh_org then
    raise exception 'organization_id must match shipment.organization_id';
  end if;

  return new;
end;
$$;

create trigger shared_reports_before_write
  before insert or update of organization_id, shipment_id
  on public.shared_reports
  for each row execute function public.shared_reports_align_org();

drop policy if exists "shared_reports_insert" on public.shared_reports;
create policy "shared_reports_insert"
  on public.shared_reports for insert
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and exists (
      select 1
      from public.shipments sh
      where sh.id = shipment_id
        and sh.organization_id = shared_reports.organization_id
    )
  );

-- ---------------------------------------------------------------------------
-- 4b. Drop customer paths that reference shipment_customer_access.tracking_request_id
--     (recreated in §6 with shipment_id). Required before dropping that column in §5.
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_for_shipment_customer" on public.profiles;
drop policy if exists "organizations_select_customer" on public.organizations;
drop policy if exists "tr_select_customer" on public.tracking_requests;
drop policy if exists "containers_select_customer" on public.containers;
drop policy if exists "te_select_customer" on public.tracking_events;
drop policy if exists "alerts_select_customer" on public.alerts;
drop policy if exists "report_messages_select_customer" on public.report_messages;
drop policy if exists "report_messages_insert_customer" on public.report_messages;
drop policy if exists "tracking_request_attachments_select_customer" on public.tracking_request_attachments;
drop policy if exists "tracking_request_files_select_customer" on storage.objects;

drop function if exists public.customer_has_shipment_access(uuid);

-- ---------------------------------------------------------------------------
-- 5. shipment_customer_access + customer_invites: shipment-scoped grants
-- ---------------------------------------------------------------------------

alter table public.shipment_customer_access
  add column if not exists shipment_id uuid references public.shipments (id) on delete cascade;

update public.shipment_customer_access s
set shipment_id = c.shipment_id
from public.tracking_requests tr
join public.containers c on c.id = tr.container_id
where s.tracking_request_id = tr.id
  and s.shipment_id is null;

alter table public.shipment_customer_access
  alter column shipment_id set not null;

drop trigger if exists shipment_customer_access_before_write on public.shipment_customer_access;

drop index if exists public.shipment_customer_access_active_unique;

alter table public.shipment_customer_access
  drop constraint if exists shipment_customer_access_tracking_request_id_fkey;

alter table public.shipment_customer_access
  drop column if exists tracking_request_id;

create unique index shipment_customer_access_active_unique
  on public.shipment_customer_access (shipment_id, customer_user_id)
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
  from public.shipments
  where id = new.shipment_id;

  if new.organization_id is null then
    raise exception 'shipment not found';
  end if;

  return new;
end;
$$;

create trigger shipment_customer_access_before_write
  before insert or update of shipment_id
  on public.shipment_customer_access
  for each row execute function public.shipment_customer_access_set_org();

alter table public.customer_invites
  add column if not exists shipment_id uuid references public.shipments (id) on delete cascade;

update public.customer_invites ci
set shipment_id = c.shipment_id
from public.tracking_requests tr
join public.containers c on c.id = tr.container_id
where ci.tracking_request_id = tr.id
  and ci.shipment_id is null;

alter table public.customer_invites
  alter column shipment_id set not null;

drop index if exists public.idx_customer_invites_tracking;

alter table public.customer_invites
  drop constraint if exists customer_invites_tracking_request_id_fkey;

alter table public.customer_invites
  drop column if exists tracking_request_id;

create index idx_customer_invites_shipment
  on public.customer_invites (shipment_id);

create index idx_customer_invites_pending
  on public.customer_invites (organization_id, shipment_id)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- 6. Customer RLS helper + policies (shipment-scoped)
-- ---------------------------------------------------------------------------

drop function if exists public.customer_has_shipment_access(uuid);

create or replace function public.customer_has_shipment_access(p_shipment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shipment_customer_access s
    where s.shipment_id = p_shipment_id
      and s.customer_user_id = auth.uid()
      and s.revoked_at is null
  );
$$;

grant execute on function public.customer_has_shipment_access(uuid) to authenticated;

drop policy if exists "profiles_select_for_shipment_customer" on public.profiles;
create policy "profiles_select_for_shipment_customer"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      join public.organization_members om
        on om.organization_id = s.organization_id
        and om.user_id = public.profiles.id
      where s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

drop policy if exists "organizations_select_customer" on public.organizations;
create policy "organizations_select_customer"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      where s.organization_id = organizations.id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

drop policy if exists "tr_select_customer" on public.tracking_requests;
create policy "tr_select_customer"
  on public.tracking_requests for select
  to authenticated
  using (
    exists (
      select 1
      from public.containers c
      join public.shipment_customer_access s on s.shipment_id = c.shipment_id
      where c.id = tracking_requests.container_id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

drop policy if exists "containers_select_customer" on public.containers;
create policy "containers_select_customer"
  on public.containers for select
  to authenticated
  using (public.customer_has_shipment_access(containers.shipment_id));

drop policy if exists "te_select_customer" on public.tracking_events;
create policy "te_select_customer"
  on public.tracking_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.containers c
      where c.id = tracking_events.container_id
        and public.customer_has_shipment_access(c.shipment_id)
    )
  );

drop policy if exists "alerts_select_customer" on public.alerts;
create policy "alerts_select_customer"
  on public.alerts for select
  to authenticated
  using (
    alerts.container_id is not null
    and exists (
      select 1
      from public.containers c
      where c.id = alerts.container_id
        and public.customer_has_shipment_access(c.shipment_id)
    )
  );

drop policy if exists "report_messages_select_customer" on public.report_messages;
create policy "report_messages_select_customer"
  on public.report_messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.containers c
      where c.id = report_messages.container_id
        and public.customer_has_shipment_access(c.shipment_id)
    )
    and is_internal = false
  );

drop policy if exists "report_messages_insert_customer" on public.report_messages;
create policy "report_messages_insert_customer"
  on public.report_messages for insert
  to authenticated
  with check (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and exists (
      select 1
      from public.containers c
      where c.id = report_messages.container_id
        and public.customer_has_shipment_access(c.shipment_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 7. container_attachments (renamed from tracking_request_attachments)
-- ---------------------------------------------------------------------------

drop trigger if exists tracking_request_attachments_validate_message_trigger on public.tracking_request_attachments;
drop trigger if exists tracking_request_attachments_before_insert on public.tracking_request_attachments;
drop trigger if exists tracking_request_attachments_only_file_name_update_trigger on public.tracking_request_attachments;
drop function if exists public.tracking_request_attachments_validate_message();
drop function if exists public.tracking_request_attachments_set_org();
drop function if exists public.tracking_request_attachments_only_file_name_update();

alter table public.tracking_request_attachments rename to container_attachments;

alter table public.container_attachments
  add column if not exists container_id uuid references public.containers (id) on delete cascade;

update public.container_attachments ca
set container_id = tr.container_id
from public.tracking_requests tr
where ca.tracking_request_id = tr.id
  and ca.container_id is null;

alter table public.container_attachments
  alter column container_id set not null;

-- RLS policies reference tracking_request_id (WITH CHECK / customer path); drop before column removal.
drop policy if exists "tracking_request_attachments_select_customer" on public.container_attachments;
drop policy if exists "tracking_request_attachments_select" on public.container_attachments;
drop policy if exists "tracking_request_attachments_insert" on public.container_attachments;
drop policy if exists "tracking_request_attachments_delete" on public.container_attachments;
drop policy if exists "tracking_request_attachments_update_file_name" on public.container_attachments;

-- Drop request-scoped index before dropping tracking_request_id (otherwise PG drops it implicitly and rename fails).
drop index if exists public.idx_tracking_request_attachments_request;

alter index public.idx_tracking_request_attachments_org
  rename to idx_container_attachments_org;

alter index public.idx_tracking_request_attachments_report_message
  rename to idx_container_attachments_report_message;

alter table public.container_attachments
  drop constraint if exists tracking_request_attachments_tracking_request_id_fkey;

alter table public.container_attachments
  drop column if exists tracking_request_id;

create index idx_container_attachments_container
  on public.container_attachments (container_id, created_at desc);

create or replace function public.container_attachments_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select c.organization_id
  into new.organization_id
  from public.containers c
  where c.id = new.container_id;

  if new.organization_id is null then
    raise exception 'container not found';
  end if;

  return new;
end;
$$;

create trigger container_attachments_before_insert
  before insert on public.container_attachments
  for each row execute function public.container_attachments_set_org();

create or replace function public.container_attachments_validate_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg_container uuid;
begin
  if new.report_message_id is null then
    return new;
  end if;

  select container_id
  into msg_container
  from public.report_messages
  where id = new.report_message_id;

  if msg_container is null then
    raise exception 'report_message not found';
  end if;

  if msg_container is distinct from new.container_id then
    raise exception 'report_message_id does not match container_id';
  end if;

  return new;
end;
$$;

create trigger container_attachments_validate_message_trigger
  before insert or update of report_message_id, container_id
  on public.container_attachments
  for each row execute function public.container_attachments_validate_message();

drop policy if exists "tracking_request_attachments_select" on public.container_attachments;
drop policy if exists "tracking_request_attachments_insert" on public.container_attachments;
drop policy if exists "tracking_request_attachments_delete" on public.container_attachments;
drop policy if exists "tracking_request_attachments_update_file_name" on public.container_attachments;

create policy "container_attachments_select"
  on public.container_attachments for select
  using (public.is_org_member(organization_id));

create policy "container_attachments_insert"
  on public.container_attachments for insert
  with check (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
    and exists (
      select 1
      from public.containers c
      where c.id = container_id
        and c.organization_id = organization_id
    )
  );

create policy "container_attachments_delete"
  on public.container_attachments for delete
  using (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  );

create policy "container_attachments_update_file_name"
  on public.container_attachments for update
  using (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  )
  with check (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  );

create policy "container_attachments_select_customer"
  on public.container_attachments for select
  to authenticated
  using (
    exists (
      select 1
      from public.containers c
      where c.id = container_attachments.container_id
        and public.customer_has_shipment_access(c.shipment_id)
    )
  );

-- Replace storage policies: path org_id / container_id / …
drop policy if exists "tracking_request_files_select" on storage.objects;
drop policy if exists "tracking_request_files_insert" on storage.objects;
drop policy if exists "tracking_request_files_update" on storage.objects;
drop policy if exists "tracking_request_files_delete" on storage.objects;
drop policy if exists "tracking_request_files_select_customer" on storage.objects;

create policy "tracking_request_files_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 2))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "tracking_request_files_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 2))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "tracking_request_files_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 2))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  )
  with check (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 2))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "tracking_request_files_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 2))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "tracking_request_files_select_customer"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 2))::uuid
        and public.customer_has_shipment_access(c.shipment_id)
    )
  );

-- Trigger rename on container_attachments (file name only)
drop trigger if exists tracking_request_attachments_only_file_name_update_trigger on public.container_attachments;
drop function if exists public.tracking_request_attachments_only_file_name_update();

create or replace function public.container_attachments_only_file_name_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.file_name := btrim(new.file_name);
  if length(new.file_name) = 0 then
    raise exception 'file_name cannot be empty';
  end if;
  if char_length(new.file_name) > 500 then
    raise exception 'file_name too long (max 500 characters)';
  end if;

  if (new.id, new.organization_id, new.container_id, new.storage_path, new.content_type, new.file_size_bytes, new.uploaded_by, new.report_message_id, new.created_at)
     is distinct from
     (old.id, old.organization_id, old.container_id, old.storage_path, old.content_type, old.file_size_bytes, old.uploaded_by, old.report_message_id, old.created_at)
  then
    raise exception 'only file_name may be updated on container_attachments';
  end if;

  return new;
end;
$$;

create trigger container_attachments_only_file_name_update_trigger
  before update on public.container_attachments
  for each row execute function public.container_attachments_only_file_name_update();

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

comment on column public.tracking_events.tracking_request_id is
  'Optional: sync/workflow row that produced this event (audit). Timeline is keyed by container_id.';

comment on table public.container_attachments is
  'Files tied to a physical container (documents tab + message uploads). Path: {org_id}/{container_id}/…';

comment on table public.shared_reports is
  'Public share link for an entire commercial shipment (all containers under shipments.id).';
