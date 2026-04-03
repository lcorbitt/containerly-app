-- Threaded report messages: optional parent in same tracking_request.

alter table public.report_messages
  add column parent_message_id uuid references public.report_messages (id) on delete cascade;

create index idx_report_messages_parent
  on public.report_messages (parent_message_id)
  where parent_message_id is not null;

create or replace function public.report_messages_validate_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_tracking uuid;
begin
  if new.parent_message_id is null then
    return new;
  end if;

  select tracking_request_id
  into p_tracking
  from public.report_messages
  where id = new.parent_message_id;

  if p_tracking is null then
    raise exception 'parent message not found';
  end if;

  if p_tracking is distinct from new.tracking_request_id then
    raise exception 'parent message belongs to a different tracking request';
  end if;

  return new;
end;
$$;

create trigger report_messages_validate_parent_trigger
  before insert or update of parent_message_id, tracking_request_id
  on public.report_messages
  for each row execute function public.report_messages_validate_parent();
