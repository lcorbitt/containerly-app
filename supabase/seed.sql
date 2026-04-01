-- Optional local seed after `supabase db reset`.
-- Requires auth users to exist; prefer creating orgs via SQL editor or `create_organization` RPC after signup.

-- Example (uncomment and replace UUIDs after creating a test user):
-- insert into public.organizations (id, name, slug) values
--   ('00000000-0000-4000-8000-000000000001', 'Demo Logistics', 'demo-logistics');
-- insert into public.organization_members (organization_id, user_id, role) values
--   ('00000000-0000-4000-8000-000000000001', '<auth.users.id>', 'owner');
