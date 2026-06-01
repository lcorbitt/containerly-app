-- Extend operator_shipments_overview_page with customer, workflow, and ETA for ops table.

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
  order_number text,
  carrier_booking_number text,
  container_number text,
  customer_name text,
  bill_of_lading text,
  shipping_line text,
  shipment_group_id uuid,
  workflow_status text,
  estimated_arrival_at timestamptz,
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
  if v_sort not in ('last_sync_at', 'created_at', 'order_number', 'bill_of_lading') then
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
    when 'order_number' then 'wm.order_number'
    when 'bill_of_lading' then 'wm.bill_of_lading'
  end;

  return query execute format($sql$
    with filtered_ids as (
      select distinct s.id as shipment_id
      from public.shipments s
      where s.organization_id = $1
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
          or s.order_number ilike $4 escape E'\\'
          or s.carrier_booking_number ilike $4 escape E'\\'
          or s.container_number ilike $4 escape E'\\'
          or (s.customer_name is not null and s.customer_name ilike $4 escape E'\\')
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
        s.order_number,
        s.carrier_booking_number,
        s.container_number,
        s.customer_name,
        s.bill_of_lading,
        s.shipping_line,
        s.shipment_group_id,
        s.workflow_status,
        s.estimated_arrival_at,
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
        wm.order_number,
        wm.carrier_booking_number,
        wm.container_number,
        wm.customer_name,
        wm.bill_of_lading,
        wm.shipping_line,
        wm.shipment_group_id,
        wm.workflow_status,
        wm.estimated_arrival_at,
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
      r.order_number,
      r.carrier_booking_number,
      r.container_number,
      r.customer_name,
      r.bill_of_lading,
      r.shipping_line,
      r.shipment_group_id,
      r.workflow_status::text,
      r.estimated_arrival_at,
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
  'Paged shipment overview with customer, workflow, and ETA for operator table.';

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
