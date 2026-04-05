-- Workspace files bucket rename + path prefix (c|s) + shipment-scoped messages and attachments.
-- Paths: {org_id}/c/{container_id}/{attachment_id}_{filename} or {org_id}/s/{shipment_id}/...

-- ---------------------------------------------------------------------------
-- 1. Storage: migrate object keys, then move bucket id tracking-request-files → workspace-files
-- ---------------------------------------------------------------------------

-- Normalize legacy keys (org/container/…) → org/c/container/…
update storage.objects o
set name =
  split_part(o.name, '/', 1)
  || '/c/'
  || substring(o.name from (char_length(split_part(o.name, '/', 1)) + 2))
where o.bucket_id in ('tracking-request-files', 'workspace-files')
  and split_part(o.name, '/', 2) not in ('c', 's');

update public.container_attachments ca
set storage_path =
  split_part(ca.storage_path, '/', 1)
  || '/c/'
  || substring(ca.storage_path from (char_length(split_part(ca.storage_path, '/', 1)) + 2))
where split_part(ca.storage_path, '/', 2) not in ('c', 's');

insert into storage.buckets (id, name, public, file_size_limit)
values ('workspace-files', 'workspace-files', false, 52428800)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

update storage.objects
set bucket_id = 'workspace-files'
where bucket_id = 'tracking-request-files';

-- Supabase disallows deleting from storage.buckets via SQL; leave the old row or relabel it.
update storage.buckets
set name = '(unused — see workspace-files)'
where id = 'tracking-request-files'
  and not exists (
    select 1 from storage.objects o where o.bucket_id = 'tracking-request-files'
  );

drop policy if exists "tracking_request_files_select" on storage.objects;
drop policy if exists "tracking_request_files_insert" on storage.objects;
drop policy if exists "tracking_request_files_update" on storage.objects;
drop policy if exists "tracking_request_files_delete" on storage.objects;
drop policy if exists "tracking_request_files_select_customer" on storage.objects;

create policy "workspace_files_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 'c'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 3))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_insert_c"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 'c'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 3))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_update_c"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 'c'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 3))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  )
  with check (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 'c'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 3))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_delete_c"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 'c'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 3))::uuid
        and c.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_select_s"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 's'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.shipments s
      where s.id = (split_part(name, '/', 3))::uuid
        and s.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_insert_s"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 's'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.shipments s
      where s.id = (split_part(name, '/', 3))::uuid
        and s.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_update_s"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 's'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.shipments s
      where s.id = (split_part(name, '/', 3))::uuid
        and s.organization_id = (split_part(name, '/', 1))::uuid
    )
  )
  with check (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 's'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.shipments s
      where s.id = (split_part(name, '/', 3))::uuid
        and s.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_delete_s"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 's'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.shipments s
      where s.id = (split_part(name, '/', 3))::uuid
        and s.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "workspace_files_select_customer_c"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 'c'
    and exists (
      select 1
      from public.containers c
      where c.id = (split_part(name, '/', 3))::uuid
        and public.customer_has_shipment_access(c.shipment_id)
    )
  );

create policy "workspace_files_select_customer_s"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 's'
    and public.customer_has_shipment_access((split_part(name, '/', 3))::uuid)
  );

-- ---------------------------------------------------------------------------
-- 2. report_messages: shipment-level thread (XOR with container_id)
-- ---------------------------------------------------------------------------

alter table public.report_messages
  add column if not exists shipment_id uuid references public.shipments (id) on delete cascade;

alter table public.report_messages
  alter column container_id drop not null;

alter table public.report_messages
  drop constraint if exists report_messages_scope_chk;

alter table public.report_messages
  add constraint report_messages_scope_chk check (
    (container_id is not null and shipment_id is null)
    or (container_id is null and shipment_id is not null)
  );

create index if not exists idx_report_messages_shipment
  on public.report_messages (shipment_id, created_at desc)
  where shipment_id is not null;

drop trigger if exists report_messages_validate_parent_trigger on public.report_messages;
drop trigger if exists report_messages_before_insert on public.report_messages;

create or replace function public.report_messages_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.container_id is not null then
    select c.organization_id
    into new.organization_id
    from public.containers c
    where c.id = new.container_id;
  elsif new.shipment_id is not null then
    select s.organization_id
    into new.organization_id
    from public.shipments s
    where s.id = new.shipment_id;
  else
    raise exception 'container_id or shipment_id required';
  end if;

  if new.organization_id is null then
    raise exception 'container or shipment not found';
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
  p_shipment uuid;
begin
  if new.parent_message_id is null then
    return new;
  end if;

  select container_id, shipment_id
  into p_container, p_shipment
  from public.report_messages
  where id = new.parent_message_id;

  if p_container is null and p_shipment is null then
    raise exception 'parent message not found';
  end if;

  if new.container_id is not null then
    if p_container is null or p_container is distinct from new.container_id then
      raise exception 'parent message belongs to a different container';
    end if;
  elsif new.shipment_id is not null then
    if p_shipment is null or p_shipment is distinct from new.shipment_id then
      raise exception 'parent message belongs to a different shipment';
    end if;
  end if;

  return new;
end;
$$;

create trigger report_messages_validate_parent_trigger
  before insert or update of parent_message_id, container_id, shipment_id
  on public.report_messages
  for each row execute function public.report_messages_validate_parent();

drop policy if exists "report_messages_select_customer" on public.report_messages;
drop policy if exists "report_messages_insert_customer" on public.report_messages;

create policy "report_messages_select_customer"
  on public.report_messages for select
  to authenticated
  using (
    is_internal = false
    and (
      exists (
        select 1
        from public.containers c
        where c.id = report_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        report_messages.shipment_id is not null
        and public.customer_has_shipment_access(report_messages.shipment_id)
      )
    )
  );

create policy "report_messages_insert_customer"
  on public.report_messages for insert
  to authenticated
  with check (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and (
      (
        container_id is not null
        and exists (
          select 1
          from public.containers c
          where c.id = report_messages.container_id
            and public.customer_has_shipment_access(c.shipment_id)
        )
      )
      or (
        shipment_id is not null
        and container_id is null
        and public.customer_has_shipment_access(report_messages.shipment_id)
      )
    )
  );

comment on table public.report_messages is
  'Thread messages: exactly one of container_id (per-unit) or shipment_id (whole commercial shipment).';

-- ---------------------------------------------------------------------------
-- 3. container_attachments → workspace_attachments (shipment or container scope)
-- ---------------------------------------------------------------------------

drop trigger if exists container_attachments_before_insert on public.container_attachments;
drop trigger if exists container_attachments_validate_message_trigger on public.container_attachments;
drop trigger if exists container_attachments_only_file_name_update_trigger on public.container_attachments;

drop policy if exists "container_attachments_select" on public.container_attachments;
drop policy if exists "container_attachments_insert" on public.container_attachments;
drop policy if exists "container_attachments_delete" on public.container_attachments;
drop policy if exists "container_attachments_update_file_name" on public.container_attachments;
drop policy if exists "container_attachments_select_customer" on public.container_attachments;

alter table public.container_attachments rename to workspace_attachments;

alter table public.workspace_attachments
  add column if not exists shipment_id uuid references public.shipments (id) on delete cascade;

alter table public.workspace_attachments
  alter column container_id drop not null;

alter table public.workspace_attachments
  drop constraint if exists workspace_attachments_scope_chk;

alter table public.workspace_attachments
  add constraint workspace_attachments_scope_chk check (
    (container_id is not null and shipment_id is null)
    or (container_id is null and shipment_id is not null)
  );

alter index public.idx_container_attachments_org rename to idx_workspace_attachments_org;
alter index public.idx_container_attachments_report_message rename to idx_workspace_attachments_report_message;
alter index public.idx_container_attachments_container rename to idx_workspace_attachments_container;

create index if not exists idx_workspace_attachments_shipment
  on public.workspace_attachments (shipment_id, created_at desc)
  where shipment_id is not null;

drop function if exists public.container_attachments_set_org();
drop function if exists public.container_attachments_validate_message();
drop function if exists public.container_attachments_only_file_name_update();

create or replace function public.workspace_attachments_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.container_id is not null then
    select c.organization_id
    into new.organization_id
    from public.containers c
    where c.id = new.container_id;
  elsif new.shipment_id is not null then
    select s.organization_id
    into new.organization_id
    from public.shipments s
    where s.id = new.shipment_id;
  else
    raise exception 'container_id or shipment_id required';
  end if;

  if new.organization_id is null then
    raise exception 'container or shipment not found';
  end if;

  return new;
end;
$$;

create trigger workspace_attachments_before_insert
  before insert on public.workspace_attachments
  for each row execute function public.workspace_attachments_set_org();

create or replace function public.workspace_attachments_validate_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg_container uuid;
  msg_shipment uuid;
begin
  if new.report_message_id is null then
    return new;
  end if;

  select container_id, shipment_id
  into msg_container, msg_shipment
  from public.report_messages
  where id = new.report_message_id;

  if msg_container is null and msg_shipment is null then
    raise exception 'report_message not found';
  end if;

  if msg_container is not null then
    if new.container_id is distinct from msg_container then
      raise exception 'report_message_id does not match container_id';
    end if;
  end if;

  if msg_shipment is not null then
    if new.shipment_id is distinct from msg_shipment then
      raise exception 'report_message_id does not match shipment_id';
    end if;
  end if;

  return new;
end;
$$;

create trigger workspace_attachments_validate_message_trigger
  before insert or update of report_message_id, container_id, shipment_id
  on public.workspace_attachments
  for each row execute function public.workspace_attachments_validate_message();

create or replace function public.workspace_attachments_only_file_name_update()
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

  if (
    new.id,
    new.organization_id,
    new.container_id,
    new.shipment_id,
    new.storage_path,
    new.content_type,
    new.file_size_bytes,
    new.uploaded_by,
    new.report_message_id,
    new.created_at
  ) is distinct from (
    old.id,
    old.organization_id,
    old.container_id,
    old.shipment_id,
    old.storage_path,
    old.content_type,
    old.file_size_bytes,
    old.uploaded_by,
    old.report_message_id,
    old.created_at
  ) then
    raise exception 'only file_name may be updated on workspace_attachments';
  end if;

  return new;
end;
$$;

create trigger workspace_attachments_only_file_name_update_trigger
  before update on public.workspace_attachments
  for each row execute function public.workspace_attachments_only_file_name_update();

create policy "workspace_attachments_select"
  on public.workspace_attachments for select
  using (public.is_org_member(organization_id));

create policy "workspace_attachments_insert"
  on public.workspace_attachments for insert
  with check (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
    and (
      (
        container_id is not null
        and exists (
          select 1
          from public.containers c
          where c.id = container_id
            and c.organization_id = organization_id
        )
      )
      or (
        shipment_id is not null
        and exists (
          select 1
          from public.shipments s
          where s.id = shipment_id
            and s.organization_id = organization_id
        )
      )
    )
  );

create policy "workspace_attachments_delete"
  on public.workspace_attachments for delete
  using (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  );

create policy "workspace_attachments_update_file_name"
  on public.workspace_attachments for update
  using (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  )
  with check (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  );

create policy "workspace_attachments_select_customer"
  on public.workspace_attachments for select
  to authenticated
  using (
    exists (
      select 1
      from public.containers c
      where c.id = workspace_attachments.container_id
        and public.customer_has_shipment_access(c.shipment_id)
    )
    or (
      workspace_attachments.shipment_id is not null
      and public.customer_has_shipment_access(workspace_attachments.shipment_id)
    )
  );

comment on table public.workspace_attachments is
  'Files tied to a container or to an entire shipment (documents tab + message uploads). Path: {org_id}/c/{container_id}/… or {org_id}/s/{shipment_id}/…';
