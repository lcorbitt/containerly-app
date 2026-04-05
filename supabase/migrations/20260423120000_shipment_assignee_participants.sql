-- Shipment-level assignee + participants; tracking_requests are sync/API rows only (no assignee/participants).
-- workspace_attachments.is_internal: customer portal + storage RLS only expose shared (false) files.

-- ---------------------------------------------------------------------------
-- 1. Shipments: assignee (primary operator for triage)
-- ---------------------------------------------------------------------------

alter table public.shipments
  add column if not exists assignee_user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_shipments_org_assignee
  on public.shipments (organization_id, assignee_user_id)
  where assignee_user_id is not null;

comment on column public.shipments.assignee_user_id is
  'Primary operator for this shipment; distinct from created_by (audit owner). Defaults to created_by on insert when null.';

create or replace function public.shipments_default_assignee_from_creator()
returns trigger
language plpgsql
as $$
begin
  if new.assignee_user_id is null and new.created_by is not null then
    new.assignee_user_id := new.created_by;
  end if;
  return new;
end;
$$;

drop trigger if exists shipments_default_assignee on public.shipments;
create trigger shipments_default_assignee
  before insert on public.shipments
  for each row execute function public.shipments_default_assignee_from_creator();

drop policy if exists "shipments_insert" on public.shipments;
create policy "shipments_insert"
  on public.shipments for insert
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and (
      assignee_user_id is null
      or exists (
        select 1
        from public.organization_members om
        where om.organization_id = shipments.organization_id
          and om.user_id = assignee_user_id
      )
    )
  );

drop policy if exists "shipments_update" on public.shipments;
create policy "shipments_update"
  on public.shipments for update
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and (
      assignee_user_id is null
      or exists (
        select 1
        from public.organization_members om
        where om.organization_id = shipments.organization_id
          and om.user_id = assignee_user_id
      )
    )
  );

comment on table public.shipments is
  'Commercial shipment or move (often one BOL). created_by = record owner; assignee_user_id = primary operator; owns containers; tracking_requests are per-container sync rows.';

-- ---------------------------------------------------------------------------
-- 2. Shipment participants (collaborators)
-- ---------------------------------------------------------------------------

create table public.shipment_participants (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shipment_id, user_id)
);

create index idx_shipment_participants_shipment
  on public.shipment_participants (shipment_id);

create index idx_shipment_participants_user
  on public.shipment_participants (user_id);

comment on table public.shipment_participants is
  'Org members collaborating on a shipment (in addition to assignee_user_id).';

alter table public.shipment_participants enable row level security;

create policy "shipment_participants_select"
  on public.shipment_participants for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipments s
      where s.id = shipment_participants.shipment_id
        and public.is_org_member(s.organization_id)
    )
  );

create policy "shipment_participants_insert"
  on public.shipment_participants for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.shipments s
      inner join public.organization_members om_new
        on om_new.organization_id = s.organization_id
        and om_new.user_id = shipment_participants.user_id
      where s.id = shipment_participants.shipment_id
        and public.is_org_member(s.organization_id)
    )
  );

create policy "shipment_participants_delete"
  on public.shipment_participants for delete
  to authenticated
  using (
    exists (
      select 1
      from public.shipments s
      where s.id = shipment_participants.shipment_id
        and public.is_org_member(s.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Drop tracking_request_participants + tracking_requests.assignee_user_id
-- ---------------------------------------------------------------------------

drop policy if exists "tracking_request_participants_select" on public.tracking_request_participants;
drop policy if exists "tracking_request_participants_insert" on public.tracking_request_participants;
drop policy if exists "tracking_request_participants_delete" on public.tracking_request_participants;

drop table if exists public.tracking_request_participants;

drop index if exists public.idx_tracking_requests_assignee;

alter table public.tracking_requests
  drop column if exists assignee_user_id;

comment on table public.tracking_requests is
  'Per-container carrier sync / polling row; audit via created_by. Assignment and collaboration are shipment-scoped.';

drop policy if exists "tr_insert" on public.tracking_requests;
create policy "tr_insert"
  on public.tracking_requests for insert
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists "tr_update" on public.tracking_requests;
create policy "tr_update"
  on public.tracking_requests for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 4. workspace_attachments: visibility for customer portal / storage
-- ---------------------------------------------------------------------------

alter table public.workspace_attachments
  add column if not exists is_internal boolean not null default true;

update public.workspace_attachments wa
set is_internal = coalesce(rm.is_internal, true)
from public.report_messages rm
where wa.report_message_id = rm.id;

comment on column public.workspace_attachments.is_internal is
  'When true, operators only; excluded from customer portal and customer storage policies.';

create or replace function public.workspace_attachments_set_internal_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.report_message_id is not null then
    select rm.is_internal
    into strict new.is_internal
    from public.report_messages rm
    where rm.id = new.report_message_id;
  end if;
  return new;
end;
$$;

drop trigger if exists workspace_attachments_internal_from_message_trigger on public.workspace_attachments;
create trigger workspace_attachments_internal_from_message_trigger
  before insert on public.workspace_attachments
  for each row execute function public.workspace_attachments_set_internal_from_message();

drop trigger if exists workspace_attachments_only_file_name_update_trigger on public.workspace_attachments;
drop function if exists public.workspace_attachments_only_file_name_update();

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
    raise exception 'only file_name and is_internal may be updated on workspace_attachments';
  end if;

  return new;
end;
$$;

create trigger workspace_attachments_only_file_name_update_trigger
  before update on public.workspace_attachments
  for each row execute function public.workspace_attachments_only_file_name_or_visibility_update();

drop policy if exists "workspace_attachments_select_customer" on public.workspace_attachments;
create policy "workspace_attachments_select_customer"
  on public.workspace_attachments for select
  to authenticated
  using (
    is_internal = false
    and (
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
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Storage: customers only fetch paths tied to shared (non-internal) rows
-- ---------------------------------------------------------------------------

drop policy if exists "workspace_files_select_customer_c" on storage.objects;
create policy "workspace_files_select_customer_c"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 'c'
    and exists (
      select 1
      from public.workspace_attachments wa
      where wa.storage_path = name
        and wa.is_internal = false
        and wa.container_id is not null
        and exists (
          select 1
          from public.containers c
          where c.id = wa.container_id
            and public.customer_has_shipment_access(c.shipment_id)
        )
    )
  );

drop policy if exists "workspace_files_select_customer_s" on storage.objects;
create policy "workspace_files_select_customer_s"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 4
    and split_part(name, '/', 2) = 's'
    and exists (
      select 1
      from public.workspace_attachments wa
      where wa.storage_path = name
        and wa.is_internal = false
        and wa.shipment_id is not null
        and public.customer_has_shipment_access(wa.shipment_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 6. operator_shipments_overview_page: shipment assignee + shipment_participants
-- ---------------------------------------------------------------------------

drop function if exists public.operator_shipments_overview_page(
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  integer,
  integer
);

create function public.operator_shipments_overview_page(
  p_organization_id uuid,
  p_user_id uuid,
  p_scope text,
  p_search text,
  p_sort_column text,
  p_sort_asc boolean,
  p_limit integer,
  p_offset integer
)
returns table (
  total_count bigint,
  id uuid,
  organization_id uuid,
  reference text,
  bill_of_lading text,
  shipping_line text,
  shipment_group_id uuid,
  created_at timestamptz,
  owner_user_id uuid,
  assignee_user_id uuid,
  tracking_requests jsonb
)
language plpgsql
stable
security invoker
set search_path = public
as $fn$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_pattern text;
  v_order text;
  v_dir text := case when coalesce(p_sort_asc, false) then 'ASC' else 'DESC' end;
  v_scope text := lower(trim(coalesce(p_scope, 'all')));
  v_sort text := lower(trim(coalesce(p_sort_column, 'last_sync_at')));
  v_limit int := least(greatest(coalesce(p_limit, 25), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if v_sort not in ('last_sync_at', 'created_at', 'reference', 'bill_of_lading') then
    v_sort := 'last_sync_at';
  end if;
  if v_scope not in ('all', 'mine', 'unassigned', 'participating') then
    v_scope := 'all';
  end if;

  if v_search is not null then
    v_pattern :=
      '%'
      || replace(replace(replace(v_search, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_')
      || '%';
  end if;

  v_order := case v_sort
    when 'last_sync_at' then 'wm.max_sync'
    when 'created_at' then 'wm.created_at'
    when 'reference' then 'wm.reference'
    when 'bill_of_lading' then 'wm.bill_of_lading'
  end;

  return query execute format($sql$
    with filtered_ids as (
      select distinct s.id as shipment_id
      from public.shipments s
      where s.organization_id = $1
        and exists (
          select 1
          from public.containers c0
          inner join public.tracking_requests tr0 on tr0.container_id = c0.id
          where c0.shipment_id = s.id
        )
        and (
          $2 = 'all'
          or (
            $2 = 'mine'
            and $3 is not null
            and (
              s.created_by = $3
              or s.assignee_user_id = $3
            )
          )
          or (
            $2 = 'unassigned'
            and s.assignee_user_id is null
          )
          or (
            $2 = 'participating'
            and $3 is not null
            and exists (
              select 1
              from public.shipment_participants sp
              where sp.shipment_id = s.id
                and sp.user_id = $3
            )
          )
        )
        and (
          $4::text is null
          or s.reference ilike $4 escape E'\\'
          or (s.bill_of_lading is not null and s.bill_of_lading ilike $4 escape E'\\')
          or (s.shipping_line is not null and s.shipping_line ilike $4 escape E'\\')
          or exists (
            select 1
            from public.containers c3
            inner join public.tracking_requests tr3 on tr3.container_id = c3.id
            where c3.shipment_id = s.id
              and (
                tr3.container_number ilike $4 escape E'\\'
                or tr3.normalized_number ilike $4 escape E'\\'
                or (
                  tr3.source_bill_of_lading is not null
                  and tr3.source_bill_of_lading ilike $4 escape E'\\'
                )
              )
          )
        )
    ),
    counted as (
      select count(*)::bigint as cnt from filtered_ids
    ),
    with_metrics as (
      select
        f.shipment_id,
        s.organization_id,
        s.reference,
        s.bill_of_lading,
        s.shipping_line,
        s.shipment_group_id,
        s.created_at,
        s.created_by as owner_user_id,
        s.assignee_user_id,
        (
          select max(tr.last_sync_at)
          from public.containers c
          inner join public.tracking_requests tr on tr.container_id = c.id
          where c.shipment_id = f.shipment_id
        ) as max_sync
      from filtered_ids f
      inner join public.shipments s on s.id = f.shipment_id
    ),
    ranked as (
      select
        wm.shipment_id,
        wm.organization_id,
        wm.reference,
        wm.bill_of_lading,
        wm.shipping_line,
        wm.shipment_group_id,
        wm.created_at,
        wm.owner_user_id,
        wm.assignee_user_id,
        wm.max_sync,
        (select cnt from counted) as total_count,
        row_number() over (
          order by %s %s nulls last, wm.created_at desc, wm.shipment_id
        ) as rn
      from with_metrics wm
    )
    select
      r.total_count,
      r.shipment_id as id,
      r.organization_id,
      r.reference,
      r.bill_of_lading,
      r.shipping_line,
      r.shipment_group_id,
      r.created_at,
      r.owner_user_id,
      r.assignee_user_id,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', tr.id,
              'container_id', tr.container_id,
              'container_number', tr.container_number,
              'normalized_number', tr.normalized_number,
              'status', tr.status,
              'last_sync_at', tr.last_sync_at,
              'created_at', tr.created_at,
              'error_message', tr.error_message,
              'source_bill_of_lading', tr.source_bill_of_lading
            )
            order by tr.container_number
          )
          from public.containers c
          inner join public.tracking_requests tr on tr.container_id = c.id
          where c.shipment_id = r.shipment_id
        ),
        '[]'::jsonb
      ) as tracking_requests
    from ranked r
    where r.rn > $5
      and r.rn <= $5 + $6
    order by r.rn
  $sql$, v_order, v_dir)
  using p_organization_id, v_scope, p_user_id, v_pattern, v_offset, v_limit;
end;
$fn$;

comment on function public.operator_shipments_overview_page is
  'Paged shipment overview: mine = created_by or assignee; unassigned = shipment.assignee_user_id null; participating = shipment_participants.';

grant execute on function public.operator_shipments_overview_page(
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  integer,
  integer
) to authenticated;
