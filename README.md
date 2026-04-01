# Containerly

Logistics / supply-chain SaaS scaffold: **Next.js (App Router)** frontend, **Supabase** (Postgres + Auth + RLS + Edge Functions), and a pluggable **external container API** adapter (mock by default).

## Layout

- `frontend/` — Next.js + Tailwind + Geist (via `next/font`)
- `supabase/migrations/` — schema, indexes, RLS, `create_organization` RPC
- `supabase/functions/` — Edge Functions (`create-tracking-request`, `get-container-details`, `search-containers`, `sync-container`, `sync-stale-requests`)

## Quick start

1. Create a Supabase project and run migrations (CLI or SQL editor):

   ```bash
   cd supabase && supabase db push
   ```

   Or paste `supabase/migrations/20250401000000_initial_schema.sql` into the SQL editor.

2. Deploy Edge Functions and set secrets (service role is injected automatically; add these in the dashboard or CLI):

   - `CRON_SECRET` — shared secret header `x-cron-secret` for `sync-stale-requests`
   - Optional: `EXTERNAL_TRACKING_API_URL`, `EXTERNAL_TRACKING_API_KEY` for a real JSONCargo-style API
   - Optional: `CONTAINER_STALE_MS` (default 15 minutes), `SYNC_BATCH_LIMIT` (default 25)

3. Schedule `sync-stale-requests` (Supabase Dashboard → Edge Functions → Cron) with a request that includes header `x-cron-secret: <CRON_SECRET>`.

4. Frontend env:

   ```bash
   cp frontend/.env.local.example frontend/.env.local
   ```

   Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

   ```bash
   cd frontend && npm run dev
   ```

## Security notes

- The browser only uses the **anon** key; **service role** stays on the server (Edge Functions / Supabase backend).
- All tenant data is scoped with **RLS** via `organization_id` and `is_org_member()`.
- `external_api_logs` has deny-all RLS for JWT clients; inserts use the service role from Edge Functions.

## External API

`supabase/functions/_shared/externalProvider.ts` implements a deterministic mock when `EXTERNAL_TRACKING_API_URL` is unset. Point the env vars at your provider and adjust `mapExternalPayload` to match its JSON shape.
