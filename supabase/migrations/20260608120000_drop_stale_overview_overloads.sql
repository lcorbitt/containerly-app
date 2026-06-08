-- Drop stale overloads of the shipments-overview RPCs.
--
-- Production accumulated older overloads of these functions because earlier
-- versions of the etd/eta-filter migrations were recorded as applied before
-- they included the matching `drop function`, so the old signatures were never
-- removed there. The result is a duplicate function and the PostgREST error:
--   "Could not choose the best candidate function between:
--    public.operator_shipments_overview_page(... p_tag_filter),
--    public.operator_shipments_overview_page(... p_tag_filter, p_eta_from, ...)"
-- Because the 4 date params have defaults, a base call matches both overloads.
--
-- This migration is forward-only and idempotent: `drop function if exists` is a
-- no-op where the stale signature is already gone (e.g. fresh `db reset`), and
-- removes the duplicate on production. The canonical overloads kept are:
--   operator: (uuid,uuid,text,text,text,boolean,integer,integer,text,date,date,date,date)
--   importer: (uuid,text,text,boolean,integer,integer,date,date,date,date)

-- Operator overview: pre-tag (8 args) and pre-date (9 args) stale overloads.
drop function if exists public.operator_shipments_overview_page(
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  integer,
  integer
);

drop function if exists public.operator_shipments_overview_page(
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  integer,
  integer,
  text
);

-- Importer granted overview: pre-date (6 args) stale overload.
drop function if exists public.importer_granted_shipments_overview_page(
  uuid,
  text,
  text,
  boolean,
  integer,
  integer
);
