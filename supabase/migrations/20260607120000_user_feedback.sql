-- In-app feedback submissions from authenticated operators and customers.

create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  category text not null check (category in ('bug', 'feature', 'general')),
  message text not null check (char_length(trim(message)) >= 10),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved', 'wont_fix')),
  page_url text not null,
  user_agent text,
  viewport_width int,
  viewport_height int,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_feedback_created_at_idx on public.user_feedback (created_at desc);
create index user_feedback_status_idx on public.user_feedback (status);
create index user_feedback_category_idx on public.user_feedback (category);

create or replace function public.set_user_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_feedback_set_updated_at
  before update on public.user_feedback
  for each row
  execute function public.set_user_feedback_updated_at();

alter table public.user_feedback enable row level security;

create policy "user_feedback_insert_own"
  on public.user_feedback
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_feedback_select_superadmin"
  on public.user_feedback
  for select
  to authenticated
  using (public.is_superadmin());

create policy "user_feedback_update_superadmin"
  on public.user_feedback
  for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());
