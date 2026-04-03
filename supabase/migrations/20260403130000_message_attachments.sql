-- Optional link from tracking_request_attachments to report_messages (message thread uploads).
-- Allow empty message body so a post can be files-only (app validates text and/or files).

alter table public.report_messages
  drop constraint if exists report_messages_body_check;

alter table public.report_messages
  add constraint report_messages_body_len_chk
  check (char_length(body) <= 8000);

alter table public.tracking_request_attachments
  add column report_message_id uuid references public.report_messages (id) on delete cascade;

create index idx_tracking_request_attachments_report_message
  on public.tracking_request_attachments (report_message_id)
  where report_message_id is not null;

create or replace function public.tracking_request_attachments_validate_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tr_msg uuid;
begin
  if new.report_message_id is null then
    return new;
  end if;

  select tracking_request_id
  into tr_msg
  from public.report_messages
  where id = new.report_message_id;

  if tr_msg is null then
    raise exception 'report_message not found';
  end if;

  if tr_msg is distinct from new.tracking_request_id then
    raise exception 'report_message_id does not match tracking_request_id';
  end if;

  return new;
end;
$$;

create trigger tracking_request_attachments_validate_message_trigger
  before insert or update of report_message_id, tracking_request_id
  on public.tracking_request_attachments
  for each row execute function public.tracking_request_attachments_validate_message();
