-- Organization logo: path on organizations + public storage (first path segment = organization id).

alter table public.organizations
  add column if not exists org_image_path text;

comment on column public.organizations.org_image_path is
  'Object path within storage bucket org-images (first segment = organization id).';

insert into storage.buckets (id, name, public, file_size_limit)
values ('org-images', 'org-images', true, 5242880)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "org_images_select_public" on storage.objects;
drop policy if exists "org_images_insert_admin" on storage.objects;
drop policy if exists "org_images_update_admin" on storage.objects;
drop policy if exists "org_images_delete_admin" on storage.objects;

create policy "org_images_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'org-images');

create policy "org_images_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'org-images'
    and position('..' in name) = 0
    and split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_org_role(split_part(name, '/', 1)::uuid, array['admin'])
  );

create policy "org_images_update_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'org-images'
    and position('..' in name) = 0
    and split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_org_role(split_part(name, '/', 1)::uuid, array['admin'])
  )
  with check (
    bucket_id = 'org-images'
    and position('..' in name) = 0
    and split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_org_role(split_part(name, '/', 1)::uuid, array['admin'])
  );

create policy "org_images_delete_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'org-images'
    and position('..' in name) = 0
    and split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_org_role(split_part(name, '/', 1)::uuid, array['admin'])
  );
