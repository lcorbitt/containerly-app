# Containerly frontend

Next.js App Router UI for the Containerly logistics portal. The browser never talks to Postgres directly for domain data — it goes through **`frontend/services/`** and TanStack Query.

## Stack

- Next.js (App Router), React, TypeScript, Tailwind
- TanStack Query — server state in `hooks/queries/` and `hooks/mutations/`
- Supabase client — auth session, realtime alerts, storage uploads only

## Run locally

```bash
cp .env.local.example .env.local   # if present; otherwise create from repo root README
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL`.

With local Supabase (`supabase start` from repo root), use credentials from `supabase status`.

## Architecture (short)

```
Component → colocated hook → TanStack Query → frontend/services/*.service.ts
  → fetch /functions/v1/<slug>  (Edge)
  → fetch /api/...              (privileged Next routes)
```

- **Route UI** lives under `app/(authenticated)/...` (operator workspace), `app/(portal)/...` (customer/operator shipment portal), and `app/(marketing)/...` (landing, login, sign-up)
- **Shared components** — `components/` only when reused across routes
- **Edge slugs** — `lib/supabase/edge-function-slugs.ts` (never hard-code URLs)
- **Wire types** — `supabase/functions/_wire/dto/` (import as `@shared/dto/...`)

Full layer rules: [`docs/architecture-frontend-backend.md`](../docs/architecture-frontend-backend.md) (including **§9** cascade delete policy) and [`.cursorrules`](../.cursorrules).

## Auth and onboarding

| Surface | Route / entry |
|---------|----------------|
| Sign in | `/login` — email/password only; OAuth below the form (dev/staging; hidden in production) |
| Sign up | `/signup` — 3-step wizard: account → organization → optional team invites |
| Set password | `/set-password` — invite/recovery; incomplete org setup → `/signup?step=2` |
| Welcome modal | `/dashboard?welcome=1` — first-run shortcuts after sign-up |

Onboarding APIs (Next `/api`, not Edge): `GET /api/onboarding/status`, `POST /api/onboarding/create-organization`. Operators without org membership are gated to `/signup?step=2` via `OnboardingGate` in the authenticated shell.

## Product surfaces

| Surface | Route / entry |
|---------|----------------|
| Dashboard triage | `/dashboard` |
| Shipments list | `/shipments` |
| Operator workspace | `/shipments/[shipmentId]` — commercial details, documents, mail tracking, optional container lines |
| Customer portal | `/shipments/hub/[shipmentId]` — invited customers and org members; auth + grant required |
| Invite accept | `/invite/accept?token=...` — customer onboarding into portal |
| New shipment | Header **New Shipment** — manual commercial entry; carrier sync from workspace after document approval |

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run lint     # ESLint
```
