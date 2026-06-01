-- Shipment-scoped alerts (document workflow without container tracking).

alter table public.alerts
  add column if not exists shipment_id uuid references public.shipments (id) on delete cascade;

create index if not exists idx_alerts_shipment
  on public.alerts (shipment_id, created_at desc)
  where shipment_id is not null;

drop policy if exists "alerts_select_customer" on public.alerts;
create policy "alerts_select_customer"
  on public.alerts for select
  to authenticated
  using (
    (
      alerts.container_id is not null
      and exists (
        select 1
        from public.containers c
        where c.id = alerts.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
    )
    or (
      alerts.shipment_id is not null
      and public.customer_has_shipment_access(alerts.shipment_id)
    )
    and (
      recipient_user_id is null
      or recipient_user_id = auth.uid()
    )
  );
