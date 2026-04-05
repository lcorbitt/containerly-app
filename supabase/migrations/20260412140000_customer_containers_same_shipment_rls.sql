-- Importers granted one container line can read every container on the same commercial shipment
-- (typical BOL multi-container visibility).

drop policy if exists "containers_select_customer" on public.containers;

create policy "containers_select_customer"
  on public.containers for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      inner join public.tracking_requests tr on tr.id = s.tracking_request_id
      inner join public.containers c_granted on c_granted.id = tr.container_id
      where s.customer_user_id = auth.uid()
        and s.revoked_at is null
        and c_granted.shipment_id = containers.shipment_id
    )
  );
