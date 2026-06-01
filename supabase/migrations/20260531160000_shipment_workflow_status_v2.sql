-- Replace shipment_workflow_status enum with product document workflow labels.
alter type public.shipment_workflow_status rename to shipment_workflow_status_old;

create type public.shipment_workflow_status as enum (
  'pending_drafts',
  'awaiting_review',
  'approved',
  'rejected',
  'originals_sent'
);

alter table public.shipments
  alter column workflow_status drop default;

alter table public.shipments
  alter column workflow_status type public.shipment_workflow_status
  using (
    case workflow_status::text
      when 'draft' then 'pending_drafts'
      when 'revisions_needed' then 'rejected'
      when 'mailed' then 'originals_sent'
      when 'in_transit' then 'originals_sent'
      else workflow_status::text
    end
  )::public.shipment_workflow_status;

alter table public.shipments
  alter column workflow_status set default 'pending_drafts';

comment on column public.shipments.workflow_status is
  'Export document workflow: pending_drafts → awaiting_review → approved/rejected → originals_sent.';

drop type public.shipment_workflow_status_old;
