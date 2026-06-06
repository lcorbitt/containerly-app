-- Customers may delete their own non-internal portal messages (mirrors update_own_customer).

create policy "report_messages_delete_own_customer"
  on public.report_messages for delete
  to authenticated
  using (
    author_kind = 'customer'
    and author_user_id is not null
    and author_user_id = auth.uid()
    and is_internal = false
    and (
      exists (
        select 1
        from public.containers c
        where c.id = report_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        report_messages.shipment_id is not null
        and public.customer_has_shipment_access(report_messages.shipment_id)
      )
    )
  );
