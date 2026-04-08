# Containerly

Logistics / supply-chain SaaS scaffold: **Next.js (App Router)** frontend, **Supabase** (Postgres + Auth + RLS + Edge Functions), and a pluggable **external container API** adapter (mock by default).

## Layout

- `frontend/` — Next.js + Tailwind + Geist (via `next/font`)
- `supabase/migrations/` — schema, indexes, RLS, `profiles` (global roles), `organization_members` (org roles)
- `supabase/functions/` — Edge Functions (flat deploy slugs; **verb-first** HTTP-style names, e.g. `create-tracking-request`, `sync-container`, `get-shipment`, `create-customer-invite`). See `frontend/lib/supabase/edge-function-slugs.ts`.

## Quick start

1. Create a Supabase project and run migrations (CLI or SQL editor):

   ```bash
   cd supabase && supabase db push
   ```

   Apply migrations in order (or use `supabase db push` for the full chain).

2. Deploy Edge Functions and set secrets (service role is injected automatically; add these in the dashboard or CLI):

   - `CRON_SECRET` — shared secret header `x-cron-secret` for `sync-stale-tracking-requests`
   - Optional: `EXTERNAL_TRACKING_API_URL`, `EXTERNAL_TRACKING_API_KEY` for a real JSONCargo-style API
   - Optional: `CONTAINER_STALE_MS` (default 15 minutes), `SYNC_BATCH_LIMIT` (default 25)

3. Schedule `sync-stale-tracking-requests` (Supabase Dashboard → Edge Functions → Cron) with a request that includes header `x-cron-secret: <CRON_SECRET>`.

**Renaming functions on an existing Supabase project:** deploy the new slugs and update callers (this repo uses `EDGE_FUNCTION_SLUGS`). Old URLs such as `/functions/v1/shipments-get` stop working once folders are renamed — remove deprecated functions in the dashboard after cutover.

4. Frontend env:

   ```bash
   cp frontend/.env.local.example frontend/.env.local
   ```

   Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for superadmin org creation via `POST /api/organizations`).

   ```bash
   cd frontend && npm run dev
   ```

### Local Supabase + Mailpit (Auth emails and invites)

1. Run `supabase start` in `supabase/` (or from the repo root with the CLI pointed at this project).
2. Run `supabase status` and copy **Project URL**, **Publishable** key, and **Secret** key into `frontend/.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Older CLI versions label the keys “anon” and “service_role”; either shape works if it matches your stack.
3. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (or your dev origin) so teammate **invite** links redirect to `/login` after acceptance. Local redirect allow-list lives in `supabase/config.toml` under `[auth]`; add more URLs there if you change host or port.
4. Open **Mailpit** at [http://127.0.0.1:54324](http://127.0.0.1:54324) to read every Auth email (invites, password reset, magic links, and sign-up confirmation if you enable it). No SMTP provider is required locally.
5. After editing `config.toml`, run `supabase stop && supabase start` so Auth picks up changes.

**Hosted projects:** configure **SMTP** (or a provider) under Supabase Dashboard → **Authentication** → **SMTP Settings**, and add redirect URLs under **URL Configuration**. Invites still require `SUPABASE_SERVICE_ROLE_KEY` on the Next server.

## Security notes

- The browser only uses the **anon** key; **service role** stays on the server (Edge Functions, Next.js Route Handlers such as `/api/organizations` and `/api/organization-members` for `inviteUserByEmail`).
- **Three access tiers:** (1) **Platform superadmin** — `profiles.role = superadmin`, not an org member; RLS helpers treat you as bypassing tenant checks (`is_superadmin()`). (2) **Org admin** — `profiles.role = user` and `organization_members.role = admin` for that org. (3) **Org member** — `profiles.role = user` and `organization_members.role = member`.
- Promote someone to platform superadmin with SQL or the Platform UI, e.g. `update public.profiles set role = 'superadmin' where id = '<user uuid>';` — not from an untrusted client.
- All tenant data is scoped with **RLS** via `organization_id` and membership helpers.
- `external_api_logs` has deny-all RLS for JWT clients; inserts use the service role from Edge Functions.

## External API

`supabase/functions/_shared/externalProvider.ts` implements a deterministic mock when `EXTERNAL_TRACKING_API_URL` is unset. Point the env vars at your provider and adjust `mapExternalPayload` to match its JSON shape.
