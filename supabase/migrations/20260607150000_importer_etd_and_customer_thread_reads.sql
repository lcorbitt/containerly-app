-- Customer unread badges + ETD on importer shipments overview.

-- Customers with active shipment access can track read cursors for message threads.
create policy "shipment_message_thread_reads_select_customer"
  on public.shipment_message_thread_reads for select
  to authenticated
  using (
    user_id = auth.uid()
    and public.customer_has_shipment_access(shipment_id)
  );

create policy "shipment_message_thread_reads_insert_customer"
  on public.shipment_message_thread_reads for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.customer_has_shipment_access(shipment_id)
    and exists (
      select 1
      from public.shipments s
      where s.id = shipment_id
        and s.organization_id = organization_id
    )
  );

create policy "shipment_message_thread_reads_update_customer"
  on public.shipment_message_thread_reads for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.customer_has_shipment_access(shipment_id)
  )
  with check (
    user_id = auth.uid()
    and public.customer_has_shipment_access(shipment_id)
  );

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
  estimated_departure_at timestamptz,
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
    'estimated_departure_at',
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
    when 'estimated_departure_at' then 'wm.estimated_departure_at'
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
        s.estimated_departure_at,
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
        wm.estimated_departure_at,
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
      r.estimated_departure_at,
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
