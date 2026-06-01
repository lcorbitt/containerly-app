-- Operator-defined labels on shipments for triage and filtering.
alter table public.shipments
  add column if not exists tags text[] not null default '{}';

comment on column public.shipments.tags is
  'Free-form operator tags for organizing and filtering shipments within an organization.';

create index if not exists shipments_tags_gin_idx
  on public.shipments using gin (tags);
