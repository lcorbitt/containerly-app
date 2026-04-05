-- Commercial shipments are owned by an org member (shipments.created_by).
-- Containers belong to shipments; tracking_requests.created_by remains audit-only.

alter table public.shipments
  add column if not exists created_by uuid references auth.users (id) on delete set null;

create index if not exists idx_shipments_org_created_by
  on public.shipments (organization_id, created_by)
  where created_by is not null;

with first_tr as (
  select distinct on (c.shipment_id)
    c.shipment_id,
    tr.created_by
  from public.containers c
  inner join public.tracking_requests tr on tr.container_id = c.id
  order by c.shipment_id, tr.created_at asc
)
update public.shipments s
set created_by = first_tr.created_by
from first_tr
where s.id = first_tr.shipment_id
  and s.created_by is null;

comment on table public.shipments is
  'Commercial shipment or move (often one BOL). Owned by created_by; owns container rows; tracking_requests attach per container for sync and workflow.';

comment on column public.shipments.created_by is
  'Org member who owns this shipment record; containers and tracking lines are grouped under it.';

comment on column public.tracking_requests.created_by is
  'Audit: user who created this sync/workflow row. Customer-facing ownership is shipments.created_by.';

drop policy if exists "shipments_insert" on public.shipments;
create policy "shipments_insert"
  on public.shipments for insert
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

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
            and s.created_by = $3
          )
          or (
            $2 = 'unassigned'
            and exists (
              select 1
              from public.containers c2
              inner join public.tracking_requests tr2 on tr2.container_id = c2.id
              where c2.shipment_id = s.id
                and tr2.assignee_user_id is null
            )
          )
          or (
            $2 = 'participating'
            and $3 is not null
            and exists (
              select 1
              from public.tracking_request_participants p
              inner join public.tracking_requests tr2 on tr2.id = p.tracking_request_id
              inner join public.containers c2 on c2.id = tr2.container_id
              where c2.shipment_id = s.id
                and p.user_id = $3
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
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', tr.id,
              'container_number', tr.container_number,
              'normalized_number', tr.normalized_number,
              'status', tr.status,
              'last_sync_at', tr.last_sync_at,
              'assignee_user_id', tr.assignee_user_id,
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
  'Paged shipment overview: mine = shipments.created_by; unassigned = any line with null assignee; participating = tracking_request_participants.';

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
