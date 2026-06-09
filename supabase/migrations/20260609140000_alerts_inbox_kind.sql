-- Distinguish in-app notifications (bell) from operational alerts (triage queue).
alter table public.alerts
  add column inbox_kind text not null default 'notification'
  check (inbox_kind in ('notification', 'operational_alert'));

comment on column public.alerts.inbox_kind is
  'notification = TopNav bell FYI; operational_alert = /alerts triage enrichment (not bell).';

update public.alerts
set inbox_kind = 'operational_alert'
where alert_type in (
  'STATUS_EXCEPTION',
  'SHIPMENT_DELAYED',
  'TRACKING_SYNC_FAILED',
  'DOCUMENT_REJECTED',
  'SLA_RESPONSE_DUE'
);

delete from public.alerts
where alert_type in ('MESSAGE_NEW', 'MESSAGE_TEAM', 'MESSAGE_REPLY');
