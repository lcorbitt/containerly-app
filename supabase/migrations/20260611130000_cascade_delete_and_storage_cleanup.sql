-- Enforce ownership cascades, add shipment_activity_events.report_message_id FK,
-- and DB-triggered Supabase Storage cleanup on row delete.

-- ---------------------------------------------------------------------------
-- 1. tracking_events.container_id — NOT NULL column must CASCADE (not SET NULL)
-- ---------------------------------------------------------------------------

alter table public.tracking_events
  drop constraint if exists tracking_events_container_id_fkey;

alter table public.tracking_events
  add constraint tracking_events_container_id_fkey
    foreign key (container_id) references public.containers (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 2. tracking_requests.container_id — sync rows owned by container
-- ---------------------------------------------------------------------------

alter table public.tracking_requests
  drop constraint if exists tracking_requests_container_id_fkey;

alter table public.tracking_requests
  add constraint tracking_requests_container_id_fkey
    foreign key (container_id) references public.containers (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 3. alerts.container_id — container-scoped triage alerts die with container
-- ---------------------------------------------------------------------------

alter table public.alerts
  drop constraint if exists alerts_container_id_fkey;

alter table public.alerts
  add constraint alerts_container_id_fkey
    foreign key (container_id) references public.containers (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 4. User attribution: created_by is audit, not ownership — SET NULL on user delete
-- ---------------------------------------------------------------------------

alter table public.tracking_requests
  drop constraint if exists tracking_requests_created_by_fkey;

alter table public.tracking_requests
  alter column created_by drop not null;

alter table public.tracking_requests
  add constraint tracking_requests_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null;

alter table public.shared_reports
  drop constraint if exists shared_reports_created_by_fkey;

alter table public.shared_reports
  alter column created_by drop not null;

alter table public.shared_reports
  add constraint shared_reports_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 5. shipment_activity_events.report_message_id — FK replaces JSON-only link
-- ---------------------------------------------------------------------------

alter table public.shipment_activity_events
  add column if not exists report_message_id uuid references public.report_messages (id) on delete cascade;

comment on column public.shipment_activity_events.report_message_id is
  'When set, timeline row mirrors a report_messages thread post; cascades on message delete.';

update public.shipment_activity_events sae
set report_message_id = (sae.metadata->>'message_id')::uuid
where sae.event_type in ('customer_message', 'operator_message')
  and sae.metadata->>'message_id' is not null
  and sae.report_message_id is null
  and exists (
    select 1
    from public.report_messages rm
    where rm.id = (sae.metadata->>'message_id')::uuid
  );

create index if not exists idx_shipment_activity_report_message
  on public.shipment_activity_events (report_message_id)
  where report_message_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Storage cleanup triggers (security definer — deletes storage.objects)
-- ---------------------------------------------------------------------------

create or replace function public.workspace_attachments_storage_cleanup()
returns trigger
language plpgsql
security definer
set search_path = storage, public
as $$
begin
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects
  where bucket_id = 'workspace-files'
    and name = old.storage_path;
  return old;
end;
$$;

drop trigger if exists workspace_attachments_storage_cleanup_trigger on public.workspace_attachments;

create trigger workspace_attachments_storage_cleanup_trigger
  after delete on public.workspace_attachments
  for each row execute function public.workspace_attachments_storage_cleanup();

create or replace function public.profiles_storage_cleanup()
returns trigger
language plpgsql
security definer
set search_path = storage, public
as $$
begin
  if old.profile_image_path is not null and length(trim(old.profile_image_path)) > 0 then
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects
    where bucket_id = 'profile-images'
      and name = old.profile_image_path;
  end if;
  return old;
end;
$$;

drop trigger if exists profiles_storage_cleanup_trigger on public.profiles;

create trigger profiles_storage_cleanup_trigger
  before delete on public.profiles
  for each row execute function public.profiles_storage_cleanup();

create or replace function public.organizations_storage_cleanup()
returns trigger
language plpgsql
security definer
set search_path = storage, public
as $$
begin
  if old.org_image_path is not null and length(trim(old.org_image_path)) > 0 then
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects
    where bucket_id = 'org-images'
      and name = old.org_image_path;
  end if;
  return old;
end;
$$;

drop trigger if exists organizations_storage_cleanup_trigger on public.organizations;

create trigger organizations_storage_cleanup_trigger
  before delete on public.organizations
  for each row execute function public.organizations_storage_cleanup();
