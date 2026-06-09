import { ContainersOverview } from "./components/ContainersOverview";

export const dynamic = "force-dynamic";

export default function ContainersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Containers
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Fleet view of active carrier lines — sync status, exceptions, and deep links into container
        workspaces.
      </p>
      <div className="mt-8">
        <ContainersOverview />
      </div>
    </div>
  );
}
