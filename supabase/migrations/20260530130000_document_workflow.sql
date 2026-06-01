-- Document approval workflow columns + shipment activity feed.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.document_group as enum ('draft', 'revision', 'original');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.document_approval_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. workspace_attachments — document workflow metadata
-- ---------------------------------------------------------------------------

alter table public.workspace_attachments
  add column if not exists document_type text,
  add column if not exists document_group public.document_group,
  add column if not exists approval_status public.document_approval_status,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists shipment_line_id uuid references public.shipment_lines (id) on delete set null;

comment on column public.workspace_attachments.document_type is
  'Export document type label (Commercial Invoice, Health Certificate, etc.).';

-- ---------------------------------------------------------------------------
-- 3. shipment_activity_events — structured portal activity feed
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.shipment_activity_event_type as enum (
    'drafts_attached',
    'documents_approved',
    'documents_rejected',
    'originals_mailed',
    'tracking_linked',
    'customer_message',
    'operator_message'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.shipment_activity_actor_kind as enum ('system', 'operator', 'customer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.shipment_activity_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type public.shipment_activity_event_type not null,
  body text not null,
  actor_kind public.shipment_activity_actor_kind not null default 'system',
  actor_user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_shipment_activity_shipment
  on public.shipment_activity_events (shipment_id, occurred_at desc);

create or replace function public.shipment_activity_events_set_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select s.organization_id
  into new.organization_id
  from public.shipments s
  where s.id = new.shipment_id;

  if new.organization_id is null then
    raise exception 'shipment not found for shipment_activity_events.shipment_id';
  end if;

  return new;
end;
$$;

drop trigger if exists shipment_activity_events_before_insert on public.shipment_activity_events;
create trigger shipment_activity_events_before_insert
  before insert on public.shipment_activity_events
  for each row execute function public.shipment_activity_events_set_org();

alter table public.shipment_activity_events enable row level security;

create policy "shipment_activity_select_org"
  on public.shipment_activity_events for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "shipment_activity_select_customer"
  on public.shipment_activity_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipment_customer_access s
      where s.shipment_id = shipment_activity_events.shipment_id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

create policy "shipment_activity_insert_org"
  on public.shipment_activity_events for insert
  to authenticated
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 4. Customer document upload RLS
-- ---------------------------------------------------------------------------

create policy "workspace_attachments_insert_customer"
  on public.workspace_attachments for insert
  to authenticated
  with check (
    is_internal = false
    and shipment_id is not null
    and exists (
      select 1
      from public.shipment_customer_access s
      where s.shipment_id = workspace_attachments.shipment_id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );

create policy "workspace_attachments_update_customer_review"
  on public.workspace_attachments for update
  to authenticated
  using (
    is_internal = false
    and shipment_id is not null
    and exists (
      select 1
      from public.shipment_customer_access s
      where s.shipment_id = workspace_attachments.shipment_id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  )
  with check (
    is_internal = false
    and shipment_id is not null
    and exists (
      select 1
      from public.shipment_customer_access s
      where s.shipment_id = workspace_attachments.shipment_id
        and s.customer_user_id = auth.uid()
        and s.revoked_at is null
    )
  );
