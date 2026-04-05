-- In-app notifications: optional per-recipient inbox (null = org broadcast).

alter table public.alerts
  add column if not exists recipient_user_id uuid references auth.users (id) on delete cascade;

alter table public.alerts
  add column if not exists actor_user_id uuid references auth.users (id) on delete set null;

comment on column public.alerts.recipient_user_id is
  'When set, only this user sees the row (inbox). When null, all org members see it (broadcast).';

comment on column public.alerts.actor_user_id is
  'User who triggered the notification, when applicable.';

create index if not exists idx_alerts_org_recipient_created
  on public.alerts (organization_id, recipient_user_id, created_at desc);

drop policy if exists "alerts_select" on public.alerts;
create policy "alerts_select"
  on public.alerts for select
  using (
    public.is_org_member(organization_id)
    and (
      public.is_superadmin()
      or recipient_user_id is null
      or recipient_user_id = auth.uid()
    )
  );

drop policy if exists "alerts_update_ack" on public.alerts;
create policy "alerts_update_ack"
  on public.alerts for update
  using (
    public.is_org_member(organization_id)
    and (
      public.is_superadmin()
      or recipient_user_id is null
      or recipient_user_id = auth.uid()
    )
  );

drop policy if exists "alerts_select_customer" on public.alerts;
create policy "alerts_select_customer"
  on public.alerts for select
  to authenticated
  using (
    alerts.container_id is not null
    and exists (
      select 1
      from public.containers c
      where c.id = alerts.container_id
        and public.customer_has_shipment_access(c.shipment_id)
    )
    and (
      recipient_user_id is null
      or recipient_user_id = auth.uid()
    )
  );
