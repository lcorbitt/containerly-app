-- Operator-managed shipment risk (shown on importer portal).

do $fn$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shipments' and column_name = 'portal_risk_level'
  ) then
    alter table public.shipments rename column portal_risk_level to risk_level;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shipments' and column_name = 'portal_customer_note'
  ) then
    alter table public.shipments rename column portal_customer_note to risk_message;
  end if;
end $fn$;

alter table public.shipments
  add column if not exists risk_level text,
  add column if not exists risk_message text;

alter table public.shipments
  drop constraint if exists shipments_portal_risk_level_check;

alter table public.shipments
  drop constraint if exists shipments_risk_level_check;

alter table public.shipments
  add constraint shipments_risk_level_check
  check (risk_level is null or risk_level in ('low', 'medium', 'high'));

comment on column public.shipments.risk_level is
  'Operator-set shipment risk (low/medium/high). Null = derive from carrier status on portal.';

comment on column public.shipments.risk_message is
  'Operator message shown on importer portal below the risk badge.';
