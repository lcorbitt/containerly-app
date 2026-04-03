-- Store display name on profiles (org members / platform accounts).
-- Populated from auth.users.raw_user_meta_data->>'full_name' (Supabase signUp options.data).

alter table public.profiles
  add column if not exists full_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, v_full_name)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

create or replace function public.handle_auth_user_metadata_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_new text;
begin
  v_old := nullif(trim(coalesce(old.raw_user_meta_data->>'full_name', '')), '');
  v_new := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  if v_old is distinct from v_new then
    update public.profiles
    set full_name = v_new
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_metadata_updated on auth.users;

create trigger on_auth_user_metadata_updated
  after update of raw_user_meta_data on auth.users
  for each row
  execute function public.handle_auth_user_metadata_updated();
