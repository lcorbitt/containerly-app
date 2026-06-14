-- Rename report_messages → shipment_messages; report_message_id → shipment_message_id.

alter table public.report_messages rename to shipment_messages;

-- Indexes on shipment_messages
alter index if exists public.idx_report_messages_org rename to idx_shipment_messages_org;
alter index if exists public.idx_report_messages_container rename to idx_shipment_messages_container;
alter index if exists public.idx_report_messages_shipment rename to idx_shipment_messages_shipment;
alter index if exists public.idx_report_messages_parent rename to idx_shipment_messages_parent;

alter table public.shipment_messages
  rename constraint report_messages_scope_chk to shipment_messages_scope_chk;
alter table public.shipment_messages
  rename constraint report_messages_body_len_chk to shipment_messages_body_len_chk;

comment on table public.shipment_messages is
  'Shipment and container workspace message threads (customer-visible and internal).';

-- Triggers: replace legacy report_messages_* functions
drop trigger if exists report_messages_before_insert on public.shipment_messages;
drop trigger if exists report_messages_validate_parent_trigger on public.shipment_messages;
drop trigger if exists report_messages_set_updated_at on public.shipment_messages;

drop function if exists public.report_messages_set_org();
drop function if exists public.report_messages_validate_parent();
drop function if exists public.set_report_messages_updated_at();

create or replace function public.shipment_messages_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.container_id is not null then
    select organization_id into new.organization_id
    from public.containers
    where id = new.container_id;
    if new.organization_id is null then
      raise exception 'container not found';
    end if;
    return new;
  end if;

  if new.shipment_id is not null then
    select organization_id into new.organization_id
    from public.shipments
    where id = new.shipment_id;
    if new.organization_id is null then
      raise exception 'shipment not found';
    end if;
    return new;
  end if;

  raise exception 'shipment_messages row must have container_id or shipment_id';
end;
$$;

create or replace function public.shipment_messages_validate_parent()
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
  from public.shipment_messages
  where id = new.parent_message_id;

  if p_container is null and p_shipment is null then
    raise exception 'parent message not found';
  end if;

  if p_container is not null and new.container_id is distinct from p_container then
    raise exception 'parent message belongs to a different container';
  end if;

  if p_shipment is not null and new.shipment_id is distinct from p_shipment then
    raise exception 'parent message belongs to a different shipment';
  end if;

  return new;
end;
$$;

create or replace function public.set_shipment_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger shipment_messages_before_insert
  before insert on public.shipment_messages
  for each row execute function public.shipment_messages_set_org();

create trigger shipment_messages_validate_parent_trigger
  before insert or update of parent_message_id, container_id, shipment_id
  on public.shipment_messages
  for each row execute function public.shipment_messages_validate_parent();

create trigger shipment_messages_set_updated_at
  before update on public.shipment_messages
  for each row execute function public.set_shipment_messages_updated_at();

-- RLS policies (recreate with shipment_messages qualifier)
drop policy if exists "report_messages_select" on public.shipment_messages;
drop policy if exists "report_messages_insert_member" on public.shipment_messages;
drop policy if exists "report_messages_select_customer" on public.shipment_messages;
drop policy if exists "report_messages_insert_customer" on public.shipment_messages;
drop policy if exists "report_messages_update_own" on public.shipment_messages;
drop policy if exists "report_messages_update_own_customer" on public.shipment_messages;
drop policy if exists "report_messages_delete_own" on public.shipment_messages;
drop policy if exists "report_messages_delete_own_customer" on public.shipment_messages;

create policy "shipment_messages_select"
  on public.shipment_messages for select
  using (public.is_org_member(organization_id));

create policy "shipment_messages_insert_member"
  on public.shipment_messages for insert
  with check (
    public.is_org_member(organization_id)
    and author_kind = 'member'
    and author_user_id = auth.uid()
  );

create policy "shipment_messages_select_customer"
  on public.shipment_messages for select
  to authenticated
  using (
    is_internal = false
    and (
      exists (
        select 1
        from public.containers c
        where c.id = shipment_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        shipment_messages.shipment_id is not null
        and public.customer_has_shipment_access(shipment_messages.shipment_id)
      )
    )
  );

create policy "shipment_messages_insert_customer"
  on public.shipment_messages for insert
  to authenticated
  with check (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and (
      exists (
        select 1
        from public.containers c
        where c.id = shipment_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        shipment_messages.shipment_id is not null
        and public.customer_has_shipment_access(shipment_messages.shipment_id)
      )
    )
  );

create policy "shipment_messages_update_own"
  on public.shipment_messages for update
  to authenticated
  using (
    author_user_id is not null
    and author_user_id = auth.uid()
    and public.is_org_member(organization_id)
  )
  with check (
    author_user_id = auth.uid()
    and char_length(trim(body)) > 0
  );

create policy "shipment_messages_update_own_customer"
  on public.shipment_messages for update
  to authenticated
  using (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and (
      exists (
        select 1
        from public.containers c
        where c.id = shipment_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        shipment_messages.shipment_id is not null
        and public.customer_has_shipment_access(shipment_messages.shipment_id)
      )
    )
  )
  with check (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and char_length(trim(body)) > 0
    and (
      exists (
        select 1
        from public.containers c
        where c.id = shipment_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        shipment_messages.shipment_id is not null
        and public.customer_has_shipment_access(shipment_messages.shipment_id)
      )
    )
  );

create policy "shipment_messages_delete_own"
  on public.shipment_messages for delete
  using (
    public.is_org_member(organization_id)
    and author_user_id is not null
    and author_user_id = auth.uid()
  );

create policy "shipment_messages_delete_own_customer"
  on public.shipment_messages for delete
  to authenticated
  using (
    author_kind = 'customer'
    and author_user_id is not null
    and author_user_id = auth.uid()
    and is_internal = false
    and (
      exists (
        select 1
        from public.containers c
        where c.id = shipment_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        shipment_messages.shipment_id is not null
        and public.customer_has_shipment_access(shipment_messages.shipment_id)
      )
    )
  );

-- FK columns on related tables
alter table public.workspace_attachments
  rename column report_message_id to shipment_message_id;

alter index if exists public.idx_workspace_attachments_report_message
  rename to idx_workspace_attachments_shipment_message;

alter table public.shipment_activity_events
  rename column report_message_id to shipment_message_id;

alter index if exists public.idx_shipment_activity_report_message
  rename to idx_shipment_activity_shipment_message;

alter table public.alerts
  rename column report_message_id to shipment_message_id;

alter index if exists public.idx_alerts_report_message
  rename to idx_alerts_shipment_message;

comment on column public.workspace_attachments.shipment_message_id is
  'Optional link to shipment_messages when uploaded as part of a thread post.';
comment on column public.shipment_activity_events.shipment_message_id is
  'When set, timeline row mirrors a shipment_messages thread post; cascades on message delete.';
comment on column public.alerts.shipment_message_id is
  'When set, in-app message alerts for this shipment_messages row.';

-- workspace_attachments triggers referencing message id
create or replace function public.workspace_attachments_set_internal_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.shipment_message_id is not null then
    select sm.is_internal
    into strict new.is_internal
    from public.shipment_messages sm
    where sm.id = new.shipment_message_id;
  end if;
  return new;
end;
$$;

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
  if new.shipment_message_id is null then
    return new;
  end if;

  select container_id, shipment_id
  into msg_container, msg_shipment
  from public.shipment_messages
  where id = new.shipment_message_id;

  if msg_container is null and msg_shipment is null then
    raise exception 'shipment_message not found';
  end if;

  if msg_container is not null then
    if new.container_id is distinct from msg_container then
      raise exception 'shipment_message_id does not match container_id';
    end if;
  end if;

  if msg_shipment is not null then
    if new.shipment_id is distinct from msg_shipment then
      raise exception 'shipment_message_id does not match shipment_id';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists workspace_attachments_validate_message_trigger on public.workspace_attachments;

create trigger workspace_attachments_validate_message_trigger
  before insert or update of shipment_message_id, container_id, shipment_id
  on public.workspace_attachments
  for each row execute function public.workspace_attachments_validate_message();

create or replace function public.workspace_attachments_only_file_name_or_visibility_update()
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
    new.shipment_message_id,
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
    old.shipment_message_id,
    old.created_at
  ) then
    raise exception 'only file_name and visibility fields may be updated';
  end if;

  return new;
end;
$$;

alter table public.shipment_messages replica identity full;
