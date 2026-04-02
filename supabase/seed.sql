-- Local dev seed: JBS Foods + three accounts (one per access tier).
-- Runs after migrations on `supabase db reset` / first `supabase start`.
--
-- 1) Platform superadmin — profiles.role = superadmin, NOT in organization_members.
--    RLS treats you as bypassing tenant checks (is_superadmin()). Use for engineering / ops only.
-- 2) Org admin — profiles.role = user, organization_members.role = admin for JBS Foods.
-- 3) Org member — profiles.role = user, organization_members.role = member for JBS Foods.
--
-- Password for all three: password
--
-- Log in (e.g. http://localhost:3000/login):
--   platform@containerly.com   — you (engineer); no org row; sees all orgs via RLS bypass
--   admin@jbsfoods.com         — customer org administrator
--   member@jbsfoods.com        — customer org member
--
-- GoTrue scans auth token columns as non-null strings; use '' not SQL NULL (otherwise login returns
-- "Database error querying schema").

create extension if not exists "pgcrypto";

do $$
declare
  v_org_id uuid := 'a0000001-0000-4000-8000-000000000001';
  v_member_user_id uuid := 'a0000002-0000-4000-8000-000000000002';
  v_platform_user_id uuid := 'a0000003-0000-4000-8000-000000000003';
  v_org_admin_user_id uuid := 'a0000004-0000-4000-8000-000000000004';
  v_pw text := crypt('password', gen_salt('bf'));
begin
  -- Tier 3: org member (global user, tenant member)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_member_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'member@jbsfoods.com',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    'member@jbsfoods.com',
    v_member_user_id,
    jsonb_build_object('sub', v_member_user_id::text, 'email', 'member@jbsfoods.com'),
    'email',
    now(),
    now(),
    now()
  );

  -- Tier 1: platform superadmin — no organization_members row (not a “customer” of any tenant)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_platform_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'platform@containerly.com',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    'platform@containerly.com',
    v_platform_user_id,
    jsonb_build_object('sub', v_platform_user_id::text, 'email', 'platform@containerly.com'),
    'email',
    now(),
    now(),
    now()
  );

  update public.profiles
  set role = 'superadmin'
  where id = v_platform_user_id;

  -- Tier 2: org admin (global user only; power comes from organization_members.admin)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_org_admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@jbsfoods.com',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    'admin@jbsfoods.com',
    v_org_admin_user_id,
    jsonb_build_object('sub', v_org_admin_user_id::text, 'email', 'admin@jbsfoods.com'),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.organizations (id, name, slug)
  values (v_org_id, 'JBS Foods', 'jbs-foods');

  insert into public.organization_members (organization_id, user_id, role) values
    (v_org_id, v_member_user_id, 'member'),
    (v_org_id, v_org_admin_user_id, 'admin');
end $$;
