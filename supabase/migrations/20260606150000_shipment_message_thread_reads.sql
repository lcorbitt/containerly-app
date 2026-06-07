-- Per-user read cursors for shipment message threads (unread badge).

create table public.shipment_message_thread_reads (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, shipment_id)
);

comment on table public.shipment_message_thread_reads is
  'Per-user last-read timestamp per shipment message thread for unread badges.';

create index idx_shipment_message_thread_reads_org_user
  on public.shipment_message_thread_reads (organization_id, user_id);

alter table public.shipment_message_thread_reads enable row level security;

create policy "shipment_message_thread_reads_select"
  on public.shipment_message_thread_reads for select
  using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );

create policy "shipment_message_thread_reads_insert"
  on public.shipment_message_thread_reads for insert
  with check (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
    and exists (
      select 1
      from public.shipments s
      where s.id = shipment_id
        and s.organization_id = organization_id
    )
  );

create policy "shipment_message_thread_reads_update"
  on public.shipment_message_thread_reads for update
  using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );
