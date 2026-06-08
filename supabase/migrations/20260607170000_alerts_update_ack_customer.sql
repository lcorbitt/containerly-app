-- Customer in-app notifications: allow customers to acknowledge alerts addressed to them.
--
-- Customers can already SELECT alerts targeted to them via `alerts_select_customer`, but the
-- existing `alerts_update_ack` policy requires org membership, so customers cannot mark their
-- own notifications read. This adds a customer-scoped UPDATE policy and re-creates the customer
-- SELECT policy with explicit parentheses so the recipient guard applies to BOTH the container
-- and shipment access branches (previously it bound only to the shipment branch).

drop policy if exists "alerts_select_customer" on public.alerts;
create policy "alerts_select_customer"
  on public.alerts for select
  to authenticated
  using (
    (
      recipient_user_id is null
      or recipient_user_id = auth.uid()
    )
    and (
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
    )
  );

-- Customers may only acknowledge alerts personally addressed to them on shipments/containers
-- they can access. Broadcast rows (recipient_user_id is null) are intentionally excluded.
drop policy if exists "alerts_update_ack_customer" on public.alerts;
create policy "alerts_update_ack_customer"
  on public.alerts for update
  to authenticated
  using (
    recipient_user_id = auth.uid()
    and (
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
    )
  )
  with check (
    recipient_user_id = auth.uid()
    and (
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
    )
  );
