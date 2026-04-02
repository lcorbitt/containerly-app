import Link from "next/link";
import { AdminOrganizationsPanel } from "@/components/admin-organizations-panel";

export const dynamic = "force-dynamic";

export default function AdminOrganizationsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Organizations
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Super admin: manage workspace context and create organizations.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          ← Users
        </Link>
      </header>
      <AdminOrganizationsPanel />
    </div>
  );
}
