-- Tracking request file attachments: Supabase Storage bucket + metadata table + RLS.
-- Object path (within bucket): {organization_id}/{tracking_request_id}/{attachment_id}_{filename}

insert into storage.buckets (id, name, public, file_size_limit)
values ('tracking-request-files', 'tracking-request-files', false, 52428800)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- ---------------------------------------------------------------------------
-- storage.objects policies (private bucket; org members for matching prefix)
-- ---------------------------------------------------------------------------

create policy "tracking_request_files_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = (split_part(name, '/', 2))::uuid
        and tr.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "tracking_request_files_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = (split_part(name, '/', 2))::uuid
        and tr.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "tracking_request_files_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = (split_part(name, '/', 2))::uuid
        and tr.organization_id = (split_part(name, '/', 1))::uuid
    )
  )
  with check (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = (split_part(name, '/', 2))::uuid
        and tr.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

create policy "tracking_request_files_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tracking-request-files'
    and (array_length(string_to_array(name, '/'), 1)) >= 3
    and public.is_org_member((split_part(name, '/', 1))::uuid)
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = (split_part(name, '/', 2))::uuid
        and tr.organization_id = (split_part(name, '/', 1))::uuid
    )
  );

-- ---------------------------------------------------------------------------
-- tracking_request_attachments
-- ---------------------------------------------------------------------------

create table public.tracking_request_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  content_type text,
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0 and file_size_bytes <= 52428800),
  uploaded_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (storage_path)
);

create index idx_tracking_request_attachments_request
  on public.tracking_request_attachments (tracking_request_id, created_at desc);

create index idx_tracking_request_attachments_org
  on public.tracking_request_attachments (organization_id);

create or replace function public.tracking_request_attachments_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select organization_id
  into new.organization_id
  from public.tracking_requests
  where id = new.tracking_request_id;

  if new.organization_id is null then
    raise exception 'tracking_request not found';
  end if;

  return new;
end;
$$;

create trigger tracking_request_attachments_before_insert
  before insert on public.tracking_request_attachments
  for each row execute function public.tracking_request_attachments_set_org();

alter table public.tracking_request_attachments enable row level security;

create policy "tracking_request_attachments_select"
  on public.tracking_request_attachments for select
  using (public.is_org_member(organization_id));

create policy "tracking_request_attachments_insert"
  on public.tracking_request_attachments for insert
  with check (
    public.is_org_member(organization_id)
    and uploaded_by = auth.uid()
    and exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_id
        and tr.organization_id = organization_id
    )
  );

create policy "tracking_request_attachments_delete"
  on public.tracking_request_attachments for delete
  using (public.is_org_member(organization_id));
