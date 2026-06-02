-- Supabase Realtime filters (e.g. organization_id=eq.…) require the old row on DELETE/UPDATE.
-- Without FULL replica identity, filtered postgres_changes subscriptions miss DELETE events.

alter table public.alerts replica identity full;
alter table public.report_messages replica identity full;
