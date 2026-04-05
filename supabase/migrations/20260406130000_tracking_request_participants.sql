-- Multiple org members as participants on a request; assignee remains a single FK on tracking_requests.

create table public.tracking_request_participants (
  id uuid primary key default gen_random_uuid(),
  tracking_request_id uuid not null references public.tracking_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tracking_request_id, user_id)
);

create index idx_tracking_request_participants_request
  on public.tracking_request_participants (tracking_request_id);

create index idx_tracking_request_participants_user
  on public.tracking_request_participants (user_id);

comment on table public.tracking_request_participants is
  'Org members collaborating on a request (separate from single assignee_user_id and from watchers).';

alter table public.tracking_request_participants enable row level security;

create policy "tracking_request_participants_select"
  on public.tracking_request_participants for select
  to authenticated
  using (
    exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_participants.tracking_request_id
        and public.is_org_member(tr.organization_id)
    )
  );

-- Inserter must be org member; added user must belong to the same organization.
create policy "tracking_request_participants_insert"
  on public.tracking_request_participants for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tracking_requests tr
      inner join public.organization_members om_new
        on om_new.organization_id = tr.organization_id
        and om_new.user_id = tracking_request_participants.user_id
      where tr.id = tracking_request_participants.tracking_request_id
        and public.is_org_member(tr.organization_id)
    )
  );

create policy "tracking_request_participants_delete"
  on public.tracking_request_participants for delete
  to authenticated
  using (
    exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_participants.tracking_request_id
        and public.is_org_member(tr.organization_id)
    )
  );
