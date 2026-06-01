-- Per-user email notification opt-in for shipment activity (operators).

create table public.shipment_notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shipment_id, user_id)
);

create index idx_shipment_notification_subscriptions_shipment
  on public.shipment_notification_subscriptions (shipment_id);

create index idx_shipment_notification_subscriptions_user
  on public.shipment_notification_subscriptions (user_id);

comment on table public.shipment_notification_subscriptions is
  'Org members who opted in to email notifications for all events on a shipment.';

alter table public.shipment_notification_subscriptions enable row level security;

create policy "shipment_notification_subscriptions_select"
  on public.shipment_notification_subscriptions for select
  to authenticated
  using (
    exists (
      select 1
      from public.shipments s
      where s.id = shipment_notification_subscriptions.shipment_id
        and public.is_org_member(s.organization_id)
    )
  );

create policy "shipment_notification_subscriptions_insert"
  on public.shipment_notification_subscriptions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.shipments s
      where s.id = shipment_notification_subscriptions.shipment_id
        and s.organization_id = shipment_notification_subscriptions.organization_id
        and public.is_org_member(s.organization_id)
    )
  );

create policy "shipment_notification_subscriptions_delete"
  on public.shipment_notification_subscriptions for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.shipments s
      where s.id = shipment_notification_subscriptions.shipment_id
        and public.is_org_member(s.organization_id)
    )
  );
