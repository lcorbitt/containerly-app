import { AdminInvitesPanel } from "./components/AdminInvitesPanel";

export const dynamic = "force-dynamic";

export default function AdminInvitesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-8">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Platform administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Invites
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Send organization member invites or provision new operator tenants for beta onboarding.
        </p>
      </header>

      <AdminInvitesPanel />
    </div>
  );
}
