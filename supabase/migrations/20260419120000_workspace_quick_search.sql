-- Typeahead search for authenticated workspace sidebar (shipments + container lines in the active org).
-- SECURITY INVOKER: RLS on underlying tables still applies.

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
      s.reference::text as title,
      coalesce(nullif(trim(s.bill_of_lading), ''), nullif(trim(s.shipping_line), ''), '')::text as subtitle,
      ('/shipments/' || s.id::text)::text as path
    from public.shipments s
    cross join pat
    cross join lim
    where p_organization_id is not null
      and s.organization_id = p_organization_id
      and pat.p is not null
      and (
        s.reference ilike pat.p escape E'\\'
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
      coalesce(nullif(trim(s.reference), ''), '')::text as subtitle,
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

revoke all on function public.workspace_quick_search(uuid, text, integer) from public;
grant execute on function public.workspace_quick_search(uuid, text, integer) to authenticated;
