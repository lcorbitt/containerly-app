-- Authors may edit their own report message body; updated_at tracks edits for clients.

alter table public.report_messages
  add column if not exists updated_at timestamptz;

update public.report_messages
set updated_at = created_at
where updated_at is null;

alter table public.report_messages
  alter column updated_at set default now(),
  alter column updated_at set not null;

create or replace function public.set_report_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists report_messages_set_updated_at on public.report_messages;

create trigger report_messages_set_updated_at
  before update on public.report_messages
  for each row
  execute function public.set_report_messages_updated_at();

drop policy if exists "report_messages_update_own" on public.report_messages;
drop policy if exists "report_messages_update_own_customer" on public.report_messages;

create policy "report_messages_update_own"
  on public.report_messages for update
  to authenticated
  using (
    author_user_id is not null
    and author_user_id = auth.uid()
    and public.is_org_member(organization_id)
  )
  with check (
    author_user_id = auth.uid()
    and char_length(trim(body)) > 0
  );

create policy "report_messages_update_own_customer"
  on public.report_messages for update
  to authenticated
  using (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and (
      exists (
        select 1
        from public.containers c
        where c.id = report_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        report_messages.shipment_id is not null
        and public.customer_has_shipment_access(report_messages.shipment_id)
      )
    )
  )
  with check (
    author_kind = 'customer'
    and author_user_id = auth.uid()
    and is_internal = false
    and char_length(trim(body)) > 0
    and (
      exists (
        select 1
        from public.containers c
        where c.id = report_messages.container_id
          and public.customer_has_shipment_access(c.shipment_id)
      )
      or (
        report_messages.shipment_id is not null
        and public.customer_has_shipment_access(report_messages.shipment_id)
      )
    )
  );
