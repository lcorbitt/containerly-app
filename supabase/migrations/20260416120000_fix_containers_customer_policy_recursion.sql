-- Fix 42P17 "infinite recursion detected in policy for relation containers".
-- containers_select_customer joined public.containers inside a FOR SELECT policy on
-- public.containers, so each inner row re-evaluated RLS → recursion.
-- Read shipment_id via SECURITY DEFINER (owner bypasses RLS on containers).

create or replace function public.container_shipment_id_bypass_rls(p_container_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.shipment_id
  from public.containers c
  where c.id = p_container_id;
$$;

comment on function public.container_shipment_id_bypass_rls(uuid) is
  'Returns containers.shipment_id for RLS policies; SECURITY DEFINER avoids recursive containers SELECT.';

revoke all on function public.container_shipment_id_bypass_rls(uuid) from public;
grant execute on function public.container_shipment_id_bypass_rls(uuid) to authenticated;

drop policy if exists "containers_select_customer" on public.containers;

create policy "containers_select_customer"
  on public.containers for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      inner join public.tracking_requests tr on tr.id = s.tracking_request_id
      where s.customer_user_id = auth.uid()
        and s.revoked_at is null
        and tr.container_id is not null
        and public.container_shipment_id_bypass_rls(tr.container_id) = containers.shipment_id
    )
  );
