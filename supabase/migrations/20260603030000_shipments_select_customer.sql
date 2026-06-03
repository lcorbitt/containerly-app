-- Customers with an active shipment_customer_access grant must be able to read the
-- parent shipments row. Without this, get-shipment's operator-row fetch (run with the
-- user client) returns null under RLS and the portal 404s with "Shipment not found",
-- even for invited/granted customers. Mirrors tracking_requests/containers customer policies.

drop policy if exists "shipments_select_customer" on public.shipments;
create policy "shipments_select_customer"
  on public.shipments for select
  to authenticated
  using (public.customer_has_shipment_access(id));
