-- Add consignee to shipments and shipment_lines; extend overview RPCs.

alter table public.shipments add column if not exists consignee text;
alter table public.shipment_lines add column if not exists consignee text;

-- Operator shipments overview: add consignee column, sort, and search.
drop function if exists public.operator_shipments_overview_page(
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  integer,
  integer,
  text,
  date,
  date,
  date,
  date
);

create function public.operator_shipments_overview_page(
  p_organization_id uuid,
  p_user_id uuid,
  p_scope text,
  p_search text,
  p_sort_column text,
  p_sort_asc boolean,
  p_limit integer,
  p_offset integer,
  p_tag_filter text default null,
  p_eta_from date default null,
  p_eta_to date default null,
  p_etd_from date default null,
  p_etd_to date default null
)
returns table (
  total_count bigint,
  id uuid,
  organization_id uuid,
  order_number text,
  carrier_booking_number text,
  container_number text,
  customer_name text,
  consignee text,
  bill_of_lading text,
  shipping_line text,
  shipment_group_id uuid,
  workflow_status text,
  port_of_loading text,
  port_of_destination text,
  estimated_departure_at timestamptz,
  estimated_arrival_at timestamptz,
  created_at timestamptz,
  owner_user_id uuid,
  assignee_user_id uuid,
  tags text[],
  tracking_requests jsonb
)
language plpgsql
stable
security invoker
set search_path = public
as $fn$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_tag_filter text := nullif(trim(coalesce(p_tag_filter, '')), '');
  v_pattern text;
  v_order text;
  v_dir text := case when coalesce(p_sort_asc, false) then 'ASC' else 'DESC' end;
  v_scope text := lower(trim(coalesce(p_scope, 'all')));
  v_sort text := lower(trim(coalesce(p_sort_column, 'last_sync_at')));
  v_limit int := least(greatest(coalesce(p_limit, 25), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if v_sort not in (
    'last_sync_at',
    'created_at',
    'order_number',
    'bill_of_lading',
    'customer_name',
    'consignee',
    'container_number',
    'port_of_loading',
    'port_of_destination',
    'assignee',
    'workflow_status',
    'estimated_departure_at',
    'estimated_arrival_at',
    'tags'
  ) then
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
    when 'customer_name' then 'wm.customer_name'
    when 'consignee' then 'wm.consignee'
    when 'container_number' then 'wm.container_number'
    when 'port_of_loading' then 'wm.port_of_loading'
    when 'port_of_destination' then 'wm.port_of_destination'
    when 'assignee' then 'wm.assignee_label'
    when 'workflow_status' then 'wm.workflow_status'
    when 'estimated_departure_at' then 'wm.estimated_departure_at'
    when 'estimated_arrival_at' then 'wm.estimated_arrival_at'
    when 'tags' then 'wm.tags_sort_key'
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
          $7::text is null
          or exists (
            select 1
            from unnest(coalesce(s.tags, '{}'::text[])) as tag_row
            where lower(tag_row) = lower($7)
          )
        )
        and (
          $8::date is null
          or (
            s.estimated_arrival_at is not null
            and s.estimated_arrival_at::date >= $8
          )
        )
        and (
          $9::date is null
          or (
            s.estimated_arrival_at is not null
            and s.estimated_arrival_at::date <= $9
          )
        )
        and (
          $10::date is null
          or (
            s.estimated_departure_at is not null
            and s.estimated_departure_at::date >= $10
          )
        )
        and (
          $11::date is null
          or (
            s.estimated_departure_at is not null
            and s.estimated_departure_at::date <= $11
          )
        )
        and (
          $4::text is null
          or s.order_number ilike $4 escape E'\\'
          or s.carrier_booking_number ilike $4 escape E'\\'
          or s.container_number ilike $4 escape E'\\'
          or (s.customer_name is not null and s.customer_name ilike $4 escape E'\\')
          or (s.consignee is not null and s.consignee ilike $4 escape E'\\')
          or (s.bill_of_lading is not null and s.bill_of_lading ilike $4 escape E'\\')
          or (s.shipping_line is not null and s.shipping_line ilike $4 escape E'\\')
          or (s.port_of_loading is not null and s.port_of_loading ilike $4 escape E'\\')
          or (s.port_of_destination is not null and s.port_of_destination ilike $4 escape E'\\')
          or exists (
            select 1
            from unnest(coalesce(s.tags, '{}'::text[])) as tag
            where tag ilike $4 escape E'\\'
          )
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
        s.consignee,
        s.bill_of_lading,
        s.shipping_line,
        s.shipment_group_id,
        s.workflow_status,
        s.port_of_loading,
        s.port_of_destination,
        s.estimated_departure_at,
        s.estimated_arrival_at,
        s.created_at,
        s.created_by as owner_user_id,
        s.assignee_user_id,
        coalesce(s.tags, '{}'::text[]) as tags,
        coalesce(
          (
            select string_agg(lower(t), ', ' order by lower(t))
            from unnest(coalesce(s.tags, '{}'::text[])) as u(t)
          ),
          ''
        ) as tags_sort_key,
        lower(coalesce(ap.full_name, ap.email)) as assignee_label,
        (
          select max(tr.last_sync_at)
          from public.containers c
          inner join public.tracking_requests tr on tr.container_id = c.id
          where c.shipment_id = f.shipment_id
        ) as max_sync
      from filtered_ids f
      inner join public.shipments s on s.id = f.shipment_id
      left join public.profiles ap on ap.id = s.assignee_user_id
    ),
    ranked as (
      select
        wm.shipment_id,
        wm.organization_id,
        wm.order_number,
        wm.carrier_booking_number,
        wm.container_number,
        wm.customer_name,
        wm.consignee,
        wm.bill_of_lading,
        wm.shipping_line,
        wm.shipment_group_id,
        wm.workflow_status,
        wm.port_of_loading,
        wm.port_of_destination,
        wm.estimated_departure_at,
        wm.estimated_arrival_at,
        wm.created_at,
        wm.owner_user_id,
        wm.assignee_user_id,
        wm.tags,
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
      r.consignee,
      r.bill_of_lading,
      r.shipping_line,
      r.shipment_group_id,
      r.workflow_status::text,
      r.port_of_loading,
      r.port_of_destination,
      r.estimated_departure_at,
      r.estimated_arrival_at,
      r.created_at,
      r.owner_user_id,
      r.assignee_user_id,
      r.tags,
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
  using
    p_organization_id,
    v_scope,
    p_user_id,
    v_pattern,
    v_offset,
    v_limit,
    v_tag_filter,
    p_eta_from,
    p_eta_to,
    p_etd_from,
    p_etd_to;
end;
$fn$;

grant execute on function public.operator_shipments_overview_page(
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  integer,
  integer,
  text,
  date,
  date,
  date,
  date
) to authenticated;

-- Importer granted shipments overview: add consignee column, sort, and search.
drop function if exists public.importer_granted_shipments_overview_page(
  uuid,
  text,
  text,
  boolean,
  integer,
  integer
);

create function public.importer_granted_shipments_overview_page(
  p_customer_user_id uuid,
  p_search text,
  p_sort_column text,
  p_sort_asc boolean,
  p_limit integer,
  p_offset integer
)
returns table (
  total_count bigint,
  access_grant_id uuid,
  id uuid,
  organization_id uuid,
  organization_name text,
  order_number text,
  customer_name text,
  consignee text,
  port_of_loading text,
  port_of_destination text,
  workflow_status text,
  estimated_arrival_at timestamptz,
  created_at timestamptz
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
  v_sort text := lower(trim(coalesce(p_sort_column, 'last_sync_at')));
  v_limit int := least(greatest(coalesce(p_limit, 25), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if v_sort not in (
    'last_sync_at',
    'created_at',
    'order_number',
    'customer_name',
    'consignee',
    'organization_name',
    'port_of_loading',
    'port_of_destination',
    'workflow_status',
    'estimated_arrival_at'
  ) then
    v_sort := 'last_sync_at';
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
    when 'customer_name' then 'wm.customer_name'
    when 'consignee' then 'wm.consignee'
    when 'organization_name' then 'wm.organization_name'
    when 'port_of_loading' then 'wm.port_of_loading'
    when 'port_of_destination' then 'wm.port_of_destination'
    when 'workflow_status' then 'wm.workflow_status'
    when 'estimated_arrival_at' then 'wm.estimated_arrival_at'
  end;

  return query execute format($sql$
    with granted as (
      select
        sca.id as access_grant_id,
        sca.shipment_id,
        sca.created_at as grant_created_at
      from public.shipment_customer_access sca
      where sca.customer_user_id = $1
        and sca.revoked_at is null
    ),
    filtered_ids as (
      select g.access_grant_id, g.shipment_id, g.grant_created_at
      from granted g
      inner join public.shipments s on s.id = g.shipment_id
      inner join public.organizations o on o.id = s.organization_id
      where (
          $2::text is null
          or s.order_number ilike $2 escape E'\\'
          or s.carrier_booking_number ilike $2 escape E'\\'
          or s.container_number ilike $2 escape E'\\'
          or (s.customer_name is not null and s.customer_name ilike $2 escape E'\\')
          or (s.consignee is not null and s.consignee ilike $2 escape E'\\')
          or (s.bill_of_lading is not null and s.bill_of_lading ilike $2 escape E'\\')
          or (s.shipping_line is not null and s.shipping_line ilike $2 escape E'\\')
          or (s.port_of_loading is not null and s.port_of_loading ilike $2 escape E'\\')
          or (s.port_of_destination is not null and s.port_of_destination ilike $2 escape E'\\')
          or o.name ilike $2 escape E'\\'
          or exists (
            select 1
            from public.containers c3
            inner join public.tracking_requests tr3 on tr3.container_id = c3.id
            where c3.shipment_id = s.id
              and (
                tr3.container_number ilike $2 escape E'\\'
                or tr3.normalized_number ilike $2 escape E'\\'
                or (
                  tr3.source_bill_of_lading is not null
                  and tr3.source_bill_of_lading ilike $2 escape E'\\'
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
        f.access_grant_id,
        f.shipment_id,
        f.grant_created_at,
        s.organization_id,
        o.name as organization_name,
        s.order_number,
        s.customer_name,
        s.consignee,
        s.port_of_loading,
        s.port_of_destination,
        s.workflow_status,
        s.estimated_arrival_at,
        s.created_at,
        (
          select max(tr.last_sync_at)
          from public.containers c
          inner join public.tracking_requests tr on tr.container_id = c.id
          where c.shipment_id = f.shipment_id
        ) as max_sync
      from filtered_ids f
      inner join public.shipments s on s.id = f.shipment_id
      inner join public.organizations o on o.id = s.organization_id
    ),
    ranked as (
      select
        wm.access_grant_id,
        wm.shipment_id,
        wm.organization_id,
        wm.organization_name,
        wm.order_number,
        wm.customer_name,
        wm.consignee,
        wm.port_of_loading,
        wm.port_of_destination,
        wm.workflow_status,
        wm.estimated_arrival_at,
        wm.created_at,
        wm.max_sync,
        (select cnt from counted) as total_count,
        row_number() over (
          order by %s %s nulls last, wm.created_at desc, wm.shipment_id
        ) as rn
      from with_metrics wm
    )
    select
      r.total_count,
      r.access_grant_id,
      r.shipment_id as id,
      r.organization_id,
      r.organization_name,
      r.order_number,
      r.customer_name,
      r.consignee,
      r.port_of_loading,
      r.port_of_destination,
      r.workflow_status::text,
      r.estimated_arrival_at,
      r.created_at
    from ranked r
    where r.rn > $3
      and r.rn <= $3 + $4
    order by r.rn
  $sql$, v_order, v_dir)
  using p_customer_user_id, v_pattern, v_offset, v_limit;
end;
$fn$;

grant execute on function public.importer_granted_shipments_overview_page(
  uuid,
  text,
  text,
  boolean,
  integer,
  integer
) to authenticated;
