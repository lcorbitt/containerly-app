import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { AdminOrganizationsPanel } from "./components/AdminOrganizationsPanel";

export const dynamic = "force-dynamic";

export default function AdminOrganizationsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <PageBreadcrumb href="/admin" label="Users" className="mb-3" />
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Organizations
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Super admin: manage workspace context and create organizations.
        </p>
      </header>
      <AdminOrganizationsPanel />
    </div>
  );
}
