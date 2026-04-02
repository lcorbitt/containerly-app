-- Allow any org member to delete shared report links (same bar as revoke/update).
drop policy if exists "shared_reports_delete" on public.shared_reports;

create policy "shared_reports_delete"
  on public.shared_reports for delete
  using (public.is_org_member(organization_id));
