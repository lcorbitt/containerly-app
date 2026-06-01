-- Notion-style customer access: email invite vs silent allowlist.

do $$ begin
  create type public.customer_invite_delivery_mode as enum ('email_invite', 'allowlist_only');
exception
  when duplicate_object then null;
end $$;

alter table public.customer_invites
  add column if not exists delivery_mode public.customer_invite_delivery_mode not null default 'email_invite';

comment on column public.customer_invites.delivery_mode is
  'email_invite: send link; allowlist_only: grant on login when email matches.';
