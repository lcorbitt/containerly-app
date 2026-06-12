-- Onboarding survey fields collected during sign-up (step 2).
alter table public.organizations
  add column if not exists team_size text,
  add column if not exists monthly_shipment_volume text;

comment on column public.organizations.team_size is
  'Self-reported team size band from sign-up (e.g. 1, 2-10, 11-50).';

comment on column public.organizations.monthly_shipment_volume is
  'Self-reported monthly shipment volume band from sign-up (e.g. 0-10, 11-50).';
