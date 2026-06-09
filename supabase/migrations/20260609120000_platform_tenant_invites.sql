-- Platform-provisioned tenant invites: operator creates their org after accepting invite.

create table public.platform_tenant_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_lower text not null,
  suggested_org_name text,
  invited_by_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  user_id uuid references auth.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create unique index platform_tenant_invites_pending_email_lower_idx
  on public.platform_tenant_invites (email_lower)
  where status = 'pending';

create index platform_tenant_invites_user_id_idx
  on public.platform_tenant_invites (user_id)
  where status = 'pending';

alter table public.platform_tenant_invites enable row level security;

comment on table public.platform_tenant_invites is
  'Superadmin tenant onboarding invites. Access via service role / Next API only.';
