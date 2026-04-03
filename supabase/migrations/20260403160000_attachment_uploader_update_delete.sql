-- Only the uploader may delete an attachment or rename it (file_name only).

drop policy if exists "tracking_request_attachments_delete" on public.tracking_request_attachments;

create policy "tracking_request_attachments_delete"
  on public.tracking_request_attachments for delete
  using (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  );

create or replace function public.tracking_request_attachments_only_file_name_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.file_name := btrim(new.file_name);
  if length(new.file_name) = 0 then
    raise exception 'file_name cannot be empty';
  end if;
  if char_length(new.file_name) > 500 then
    raise exception 'file_name too long (max 500 characters)';
  end if;

  if (new.id, new.organization_id, new.tracking_request_id, new.storage_path, new.content_type, new.file_size_bytes, new.uploaded_by, new.report_message_id, new.created_at)
     is distinct from
     (old.id, old.organization_id, old.tracking_request_id, old.storage_path, old.content_type, old.file_size_bytes, old.uploaded_by, old.report_message_id, old.created_at)
  then
    raise exception 'only file_name may be updated on tracking_request_attachments';
  end if;

  return new;
end;
$$;

create trigger tracking_request_attachments_only_file_name_update_trigger
  before update on public.tracking_request_attachments
  for each row execute function public.tracking_request_attachments_only_file_name_update();

create policy "tracking_request_attachments_update_file_name"
  on public.tracking_request_attachments for update
  using (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  )
  with check (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
  );
