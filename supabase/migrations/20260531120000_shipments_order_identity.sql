-- Replace shipments.reference with order_number + carrier_booking_number + container_number.

alter table public.shipments
  add column if not exists order_number text,
  add column if not exists carrier_booking_number text,
  add column if not exists container_number text;

update public.shipments s
set
  order_number = coalesce(
    nullif(trim(s.order_number), ''),
    (
      select nullif(trim(sl.order_number), '')
      from public.shipment_lines sl
      where sl.shipment_id = s.id
      order by sl.sort_order, sl.created_at
      limit 1
    ),
    nullif(trim(s.reference), ''),
    'UNKNOWN'
  ),
  carrier_booking_number = coalesce(
    nullif(trim(s.carrier_booking_number), ''),
    (
      select nullif(trim(sl.carrier_booking_number), '')
      from public.shipment_lines sl
      where sl.shipment_id = s.id
      order by sl.sort_order, sl.created_at
      limit 1
    ),
    nullif(trim(s.bill_of_lading), ''),
    'UNKNOWN'
  ),
  container_number = coalesce(
    nullif(trim(s.container_number), ''),
    (
      select nullif(trim(sl.container_number), '')
      from public.shipment_lines sl
      where sl.shipment_id = s.id
      order by sl.sort_order, sl.created_at
      limit 1
    ),
    (
      select nullif(trim(c.container_number), '')
      from public.containers c
      where c.shipment_id = s.id
      order by c.created_at
      limit 1
    ),
    nullif(trim(s.reference), ''),
    'UNKNOWN'
  );

alter table public.shipments
  alter column order_number set not null,
  alter column carrier_booking_number set not null,
  alter column container_number set not null;

alter table public.shipments drop column if exists reference;

create index if not exists idx_shipments_order_number
  on public.shipments (organization_id, order_number);

comment on column public.shipments.order_number is
  'Primary commercial identifier (PO / order no.) shown in lists and shipment headers.';
comment on column public.shipments.carrier_booking_number is
  'Carrier booking reference for the shipment.';
comment on column public.shipments.container_number is
  'Expected or active container number for the shipment.';

-- operator_shipments_overview_page: order_number identity + include doc-only shipments
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
        wm.order_number,
        wm.carrier_booking_number,
        wm.container_number,
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
      r.order_number,
      r.carrier_booking_number,
      r.container_number,
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
  'Paged shipment overview keyed by order_number; includes documentation-only shipments without carrier sync.';

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

-- workspace_quick_search: use order_number instead of dropped reference column
create or replace function public.workspace_quick_search(
  p_organization_id uuid,
  p_query text,
  p_limit integer default 8
)
returns table (
  kind text,
  id uuid,
  title text,
  subtitle text,
  path text
)
language sql
stable
security invoker
set search_path = public
as $$
  with pat as (
    select case
      when nullif(trim(coalesce(p_query, '')), '') is null then null::text
      else
        '%'
        || replace(replace(replace(trim(p_query), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_')
        || '%'
    end as p
  ),
  lim as (
    select greatest(1, least(coalesce(nullif(p_limit, 0), 8), 12))::int as n
  )
  (
    select
      'shipment'::text as kind,
      s.id,
      s.order_number::text as title,
      coalesce(nullif(trim(s.bill_of_lading), ''), nullif(trim(s.shipping_line), ''), '')::text as subtitle,
      ('/shipments/' || s.id::text)::text as path
    from public.shipments s
    cross join pat
    cross join lim
    where p_organization_id is not null
      and s.organization_id = p_organization_id
      and pat.p is not null
      and (
        s.order_number ilike pat.p escape E'\\'
        or s.carrier_booking_number ilike pat.p escape E'\\'
        or s.container_number ilike pat.p escape E'\\'
        or (s.bill_of_lading is not null and s.bill_of_lading ilike pat.p escape E'\\')
        or (s.shipping_line is not null and s.shipping_line ilike pat.p escape E'\\')
      )
    order by s.updated_at desc nulls last
    limit (select lim.n from lim)
  )
  union all
  (
    select
      'container'::text as kind,
      c.id,
      coalesce(nullif(trim(tr.container_number), ''), c.container_number)::text as title,
      coalesce(nullif(trim(s.order_number), ''), '')::text as subtitle,
      ('/containers/' || c.id::text)::text as path
    from public.containers c
    inner join public.tracking_requests tr
      on tr.container_id = c.id
      and tr.organization_id = c.organization_id
    left join public.shipments s on s.id = c.shipment_id
    cross join pat
    cross join lim
    where p_organization_id is not null
      and c.organization_id = p_organization_id
      and pat.p is not null
      and (
        c.container_number ilike pat.p escape E'\\'
        or c.normalized_number ilike pat.p escape E'\\'
        or tr.container_number ilike pat.p escape E'\\'
        or tr.normalized_number ilike pat.p escape E'\\'
      )
    order by c.updated_at desc nulls last
    limit (select lim.n from lim)
  );
$$;
