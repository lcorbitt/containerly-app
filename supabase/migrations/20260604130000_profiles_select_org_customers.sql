-- Org members can read importer profile rows for customers granted access on their shipments
-- (needed for shipment message thread author names in the operator UI).

create policy "profiles_select_org_customers"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access sca
      inner join public.organization_members om
        on om.organization_id = sca.organization_id
        and om.user_id = auth.uid()
      where sca.customer_user_id = profiles.id
        and sca.revoked_at is null
    )
  );
