-- Profiles (global roles), auth sync, superadmin helpers, org RLS updates.
--
-- Access model (keep these separate):
--   • Platform superadmin — profiles.role = superadmin; NOT in organization_members; RLS bypass via is_superadmin().
--   • Org admin — profiles.role = user; organization_members.role = admin for that org.
--   • Org member — profiles.role = user; organization_members.role = member.
--
-- Org roles are member | admin (owner migrated to admin). Org creation is backend-only.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'superadmin')),
  created_at timestamptz not null default now()
);

insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_auth_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_email_updated();

-- ---------------------------------------------------------------------------
-- Superadmin helper (SECURITY DEFINER; avoids RLS recursion on profiles)
-- ---------------------------------------------------------------------------

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'superadmin'
  );
$$;

grant execute on function public.is_superadmin() to authenticated;

-- ---------------------------------------------------------------------------
-- Org roles: migrate owner -> admin; tighten check constraint
-- ---------------------------------------------------------------------------

update public.organization_members
set role = 'admin'
where role = 'owner';

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check check (role in ('member', 'admin'));

-- ---------------------------------------------------------------------------
-- RLS helpers: superadmin bypasses org membership checks
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(_organization_id uuid, _roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin()
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = _organization_id
        and m.user_id = auth.uid()
        and (_roles is null or m.role = any (_roles))
    );
$$;

create or replace function public.has_org_role(_organization_id uuid, _roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin()
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = _organization_id
        and m.user_id = auth.uid()
        and m.role = any (_roles)
    );
$$;

-- ---------------------------------------------------------------------------
-- Remove client-callable org bootstrap (use backend + service role)
-- ---------------------------------------------------------------------------

drop function if exists public.create_organization(text, text);

-- ---------------------------------------------------------------------------
-- Profiles RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_superadmin"
  on public.profiles for select
  using (id = auth.uid() or public.is_superadmin());

-- ---------------------------------------------------------------------------
-- Organizations: align with superadmin + members; admin can update
-- ---------------------------------------------------------------------------

drop policy if exists org_select_member on public.organizations;
drop policy if exists org_update_admin on public.organizations;

create policy "organizations_select_member_or_superadmin"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "organizations_update_admin_or_superadmin"
  on public.organizations for update
  using (public.has_org_role(id, array['admin']));

-- No insert policy for authenticated: create organizations via backend + service_role only.

-- ---------------------------------------------------------------------------
-- Organization members: admins manage; members read
-- ---------------------------------------------------------------------------

drop policy if exists org_members_select on public.organization_members;

create policy "org_members_select"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

create policy "org_members_insert_admin"
  on public.organization_members for insert
  with check (
    public.is_superadmin()
    or public.has_org_role(organization_id, array['admin'])
  );

create policy "org_members_update_admin"
  on public.organization_members for update
  using (
    public.is_superadmin()
    or public.has_org_role(organization_id, array['admin'])
  )
  with check (
    public.is_superadmin()
    or public.has_org_role(organization_id, array['admin'])
  );

create policy "org_members_delete_admin"
  on public.organization_members for delete
  using (
    public.is_superadmin()
    or public.has_org_role(organization_id, array['admin'])
  );

-- ---------------------------------------------------------------------------
-- Org-scoped tables: elevated actions use admin (owner removed)
-- ---------------------------------------------------------------------------

drop policy if exists containers_delete on public.containers;
create policy "containers_delete"
  on public.containers for delete
  using (public.has_org_role(organization_id, array['admin']));

drop policy if exists shipments_delete on public.shipments;
create policy "shipments_delete"
  on public.shipments for delete
  using (public.has_org_role(organization_id, array['admin']));

drop policy if exists tr_delete on public.tracking_requests;
create policy "tr_delete"
  on public.tracking_requests for delete
  using (public.has_org_role(organization_id, array['admin']));
