-- Tie message notifications to report_messages so they are removed when the message is deleted.

alter table public.alerts
  add column if not exists report_message_id uuid references public.report_messages (id) on delete cascade;

comment on column public.alerts.report_message_id is
  'When set, in-app message alerts (MESSAGE_NEW, MESSAGE_TEAM, MESSAGE_REPLY) for this report_messages row.';

create index if not exists idx_alerts_report_message
  on public.alerts (report_message_id)
  where report_message_id is not null;
