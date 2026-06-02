-- Shipment improvement engine: root cause tagging + org performance guardrails

alter table public.shipments
  add column if not exists root_cause text check (
    root_cause is null
    or root_cause in ('docs_late', 'port_congestion', 'miscommunication', 'internal_delay')
  );

comment on column public.shipments.root_cause is
  'Operator-selected root cause when resolving a triage item (internal analytics).';

alter table public.organizations
  add column if not exists performance_settings jsonb not null default '{
    "sla_response_hours": 24,
    "stale_update_reminder_hours": 48,
    "required_document_types": []
  }'::jsonb;

comment on column public.organizations.performance_settings is
  'Org-level guardrails: SLA response expectation, stale-update reminders, required doc checklist.';
