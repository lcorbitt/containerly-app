-- Allow any org member to delete workspace attachments (wrong-upload cleanup).
-- Rename remains uploader-only via workspace_attachments_update_file_name.

drop policy if exists "workspace_attachments_delete" on public.workspace_attachments;

create policy "workspace_attachments_delete"
  on public.workspace_attachments for delete
  using (public.is_org_member(organization_id));
