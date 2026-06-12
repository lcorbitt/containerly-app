# Containerly

Logistics customer portal for operators and importers: **documentation-first shipments** (commercial header + order lines, document approval workflow, activity feed) with **optional carrier container tracking**. Built on **Next.js (App Router)**, **Supabase** (Postgres + Auth + RLS + Edge Functions), and a pluggable **external container API** adapter (mock by default).

## Layout

- `frontend/` — Next.js + Tailwind + Geist (via `next/font`); route-based UI, TanStack Query, `frontend/services/` → Edge or `/api`
- `supabase/migrations/` — schema, indexes, RLS, commercial shipment model, document workflow, alerts
- `supabase/functions/` — Edge Functions (flat deploy slugs; **verb-first** HTTP-style names). See `frontend/lib/supabase/edge-function-slugs.ts`.
- `supabase/functions/_wire/dto/` — HTTP contracts (`@shared/dto/...` in frontend and Edge)
- `supabase/functions/_lib/` — Edge domain services (`@supabase-shared/...`)
- `supabase/functions/_models/` — table-scoped DB access (`@models/...`)
- `docs/architecture-frontend-backend.md` — layer rules, data flow, and feature checklist

### Key Edge slugs

| Area | Slugs |
|------|--------|
| Tracking (optional, premium) | `create-tracking-request`, `sync-container`, `search-containers`, `lookup-bol-containers`, … |
| Shipments | `create-shipment`, `update-shipment`, `get-shipment`, `review-shipment-document`, `claim-shipment-access`, … |
| Customers | `create-customer-invite`, `accept-customer-invite`, `complete-customer-shipment-setup` |
| Auth | `notify-password-changed` |
| Reports | `get-public-report`, `post-report-message`, `post-customer-shipment-message` |

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
   - Optional: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — transactional email (invites, document events, messages)
   - Optional: `PUBLIC_SITE_URL` — deep links in emails and invite redirects (also set in frontend env)

3. Schedule `sync-stale-tracking-requests` (Supabase Dashboard → Edge Functions → Cron) with a request that includes header `x-cron-secret: <CRON_SECRET>`.

**Renaming functions on an existing Supabase project:** deploy the new slugs and update callers (this repo uses `EDGE_FUNCTION_SLUGS`). Old URLs such as `/functions/v1/shipments-get` stop working once folders are renamed — remove deprecated functions in the dashboard after cutover.

4. Frontend env:

   ```bash
   cp frontend/.env.local.example frontend/.env.local
   ```

   Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for superadmin org creation via `POST /api/organizations`), and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

   ```bash
   cd frontend && npm run dev
   ```

### Local Supabase + Mailpit (Auth emails and invites)

1. Run `supabase start` in `supabase/` (or from the repo root with the CLI pointed at this project).
2. Run `supabase status` and copy **Project URL**, **Publishable** key, and **Secret** key into `frontend/.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Older CLI versions label the keys “anon” and “service_role”; either shape works if it matches your stack.
3. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (or your dev origin) so teammate **invite** links redirect through `/auth/callback` to `/set-password`. Local redirect allow-list lives in `supabase/config.toml` under `[auth]`; add more URLs there if you change host or port.
4. Open **Mailpit** at [http://127.0.0.1:54324](http://127.0.0.1:54324) to read every Auth email (invites, password reset, magic links, and sign-up confirmation if you enable it). No SMTP provider is required locally.
5. After editing `config.toml`, run `supabase stop && supabase start` so Auth picks up changes.

**Hosted projects (beta operator onboarding):** configure **SMTP** (or a provider) under Supabase Dashboard → **Authentication** → **SMTP Settings**, and add redirect URLs under **URL Configuration**:

- `{SITE_URL}/auth/callback`
- `{SITE_URL}/set-password`
- `{SITE_URL}/forgot-password`
- `{SITE_URL}/login`
- `{SITE_URL}/signup` (and `/signup?step=2`, `/signup?step=3` for the onboarding wizard)

Also enable **Secure password change** under **Authentication** → **Providers** → **Email** so signed-in users must re-enter their current password in **Settings** before updating.

Deploy the `notify-password-changed` Edge function and set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `PUBLIC_SITE_URL` so password-update confirmations send via Containerly (Resend). Supabase Auth still sends invite and reset links; Resend sends the post-change security notification.

Invites still require `SUPABASE_SERVICE_ROLE_KEY` on the Next server (`POST /api/organization-members` → `inviteUserByEmail`, `POST /api/admin/tenant-invites` for new tenant onboarding).

### Operator sign-up and onboarding

**Self-serve sign-up** lives at `/signup` (3-step wizard):

1. **Create an Account** — email/password (optional referral source) or OAuth (Google, Microsoft; **dev/staging only** until launch — hidden in production builds).
2. **Name Your Team** — organization name, team size, monthly shipment volume → `POST /api/onboarding/create-organization` (self-serve or tenant-invite path).
3. **Invite Your Team** (optional) — multi-row teammate invites via repeated `POST /api/organization-members`; **Skip For Now** continues to the dashboard.

`/login` is **sign-in only**; marketing CTAs point new users to `/signup`. After sign-up, users land on `/dashboard?welcome=1` and see a welcome modal with shortcuts to add a shipment or invite teammates.

Operators **without an organization** who hit authenticated routes are redirected to `/signup?step=2`. The legacy `/onboarding/create-organization` route redirects there as well.

**Organization onboarding fields** (migration `20260611120000_organization_onboarding_profile.sql`): `organizations.team_size`, `organizations.monthly_shipment_volume`.

### Operator onboarding (superadmin)

Platform **Super Admin → Invites** (`/admin/invites`) supports two flows:

1. **Invite to Organization** — add someone to an existing tenant (same API as Settings → Organization).
2. **Invite New Tenant** — email invite for a new operator company; after set-password they continue the wizard at `/signup?step=2` (suggested org name pre-filled when a pending tenant invite exists).

Apply migrations `20260609120000_platform_tenant_invites.sql` and `20260611120000_organization_onboarding_profile.sql` before using tenant invites and onboarding profile fields.

## Security notes

- The browser only uses the **anon** key; **service role** stays on the server (Edge Functions, Next.js Route Handlers such as `/api/organizations` and `/api/organization-members` for `inviteUserByEmail`).
- **Three access tiers:** (1) **Platform superadmin** — `profiles.role = superadmin`, not an org member; RLS helpers treat you as bypassing tenant checks (`is_superadmin()`). (2) **Org admin** — `profiles.role = user` and `organization_members.role = admin` for that org. (3) **Org member** — `profiles.role = user` and `organization_members.role = member`.
- Promote someone to platform superadmin with SQL or the Platform UI, e.g. `update public.profiles set role = 'superadmin' where id = '<user uuid>';` — not from an untrusted client.
- All tenant data is scoped with **RLS** via `organization_id` and membership helpers.
- `external_api_logs` has deny-all RLS for JWT clients; inserts use the service role from Edge Functions.

## Local demo seed

After `supabase db reset`, log in with `password` for any seeded account (see `supabase/seed.sql` header):

- **Operator:** `admin@jbsfoods.com` — create shipments from **New Shipment** in the header; manage documents and mail tracking on `/shipments/[id]`
- **Importer:** `importer@demo.com` — portal on `/requests/[id]` for MSCU1234567 (tracking + docs) and **JBS-EXP-2026-0142** (documentation-only, no containers)

Seed includes commercial fields, `shipment_lines`, pending document approvals, activity events, and workflow alerts (`DOCUMENT_REJECTED`, `DOCUMENTS_APPROVED`, etc.).

## External API

`supabase/functions/_lib/providers/jsoncargo/` implements the container tracking adapter. Point env vars at your provider (or the repo mock server) and adjust mapping in that module to match its JSON shape.
