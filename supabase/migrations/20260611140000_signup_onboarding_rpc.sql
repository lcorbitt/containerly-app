-- Self-serve sign-up org creation and onboarding status via authenticated RPC
-- (avoids requiring SUPABASE_SERVICE_ROLE_KEY on Next for /api/onboarding/*).

create or replace function public.get_onboarding_status()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid := auth.uid();
  v_email_lower text;
  v_org_id uuid;
  v_invite jsonb;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select om.organization_id
  into v_org_id
  from public.organization_members om
  where om.user_id = v_user_id
  order by om.created_at asc
  limit 1;

  if v_org_id is not null then
    return jsonb_build_object(
      'has_org_membership', true,
      'organization_id', v_org_id,
      'pending_tenant_invite', null
    );
  end if;

  select lower(trim(u.email))
  into v_email_lower
  from auth.users u
  where u.id = v_user_id;

  select jsonb_build_object(
    'id', pti.id,
    'suggested_org_name', pti.suggested_org_name
  )
  into v_invite
  from public.platform_tenant_invites pti
  where pti.status = 'pending'
    and pti.expires_at > now()
    and (
      pti.user_id = v_user_id
      or pti.email_lower = v_email_lower
    )
  limit 1;

  return jsonb_build_object(
    'has_org_membership', false,
    'organization_id', null,
    'pending_tenant_invite', v_invite
  );
end;
$$;

create or replace function public.complete_signup_organization(
  p_name text,
  p_slug text default null,
  p_team_size text default null,
  p_monthly_shipment_volume text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email_lower text;
  v_name text;
  v_slug text;
  v_org_id uuid;
  v_invite_id uuid;
  v_pending_user_id uuid;
  v_pending_id uuid;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  v_name := trim(coalesce(p_name, ''));
  if v_name = '' then
    raise exception 'name is required' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.organization_members om
    where om.user_id = v_user_id
    limit 1
  ) then
    raise exception 'You already belong to an organization' using errcode = 'P0001';
  end if;

  select lower(trim(u.email))
  into v_email_lower
  from auth.users u
  where u.id = v_user_id;

  if v_email_lower is null or v_email_lower = '' then
    raise exception 'Account email not found' using errcode = '22023';
  end if;

  select pti.id, pti.user_id
  into v_pending_id, v_pending_user_id
  from public.platform_tenant_invites pti
  where pti.status = 'pending'
    and pti.expires_at > now()
    and pti.email_lower = v_email_lower
  limit 1;

  if v_pending_id is not null
    and v_pending_user_id is not null
    and v_pending_user_id <> v_user_id then
    raise exception 'Tenant invite is assigned to a different user' using errcode = '42501';
  end if;

  v_slug := coalesce(
    nullif(trim(coalesce(p_slug, '')), ''),
    lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'))
  );
  if v_slug = '' then
    raise exception 'Invalid slug' using errcode = '22023';
  end if;

  insert into public.organizations (name, slug, team_size, monthly_shipment_volume)
  values (
    v_name,
    v_slug,
    nullif(trim(coalesce(p_team_size, '')), ''),
    nullif(trim(coalesce(p_monthly_shipment_volume, '')), '')
  )
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'admin');

  if v_pending_id is not null then
    update public.platform_tenant_invites
    set
      status = 'accepted',
      user_id = v_user_id,
      organization_id = v_org_id,
      accepted_at = now()
    where id = v_pending_id
      and status = 'pending'
    returning id into v_invite_id;
  end if;

  return jsonb_build_object(
    'id', v_org_id,
    'invite_id', v_invite_id
  );
exception
  when unique_violation then
    raise exception 'Organization slug already exists' using errcode = '23505';
end;
$$;

revoke all on function public.get_onboarding_status() from public;
grant execute on function public.get_onboarding_status() to authenticated;

revoke all on function public.complete_signup_organization(text, text, text, text) from public;
grant execute on function public.complete_signup_organization(text, text, text, text) to authenticated;
