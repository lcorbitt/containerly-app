-- User profile photos: path on profiles + public storage bucket (path prefix = auth user id).

alter table public.profiles
  add column if not exists profile_image_path text;

comment on column public.profiles.profile_image_path is
  'Object path within storage bucket profile-images (first segment = user id).';

insert into storage.buckets (id, name, public, file_size_limit)
values ('profile-images', 'profile-images', true, 5242880)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Anyone can read (public bucket URLs); writes limited to own folder.
create policy "profile_images_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-images');

create policy "profile_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and split_part(name, '/', 1) = auth.uid()::text
    and position('..' in name) = 0
  );

create policy "profile_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and split_part(name, '/', 1) = auth.uid()::text
    and position('..' in name) = 0
  )
  with check (
    bucket_id = 'profile-images'
    and split_part(name, '/', 1) = auth.uid()::text
    and position('..' in name) = 0
  );

create policy "profile_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and split_part(name, '/', 1) = auth.uid()::text
    and position('..' in name) = 0
  );
