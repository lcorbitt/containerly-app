-- Deliver report_messages rows to connected clients (Supabase Realtime).

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'report_messages'
     ) then
    alter publication supabase_realtime add table public.report_messages;
  end if;
end $$;
