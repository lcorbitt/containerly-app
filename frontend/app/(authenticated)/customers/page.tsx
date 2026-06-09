import { CustomersDirectory } from "./components/CustomersDirectory";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Customers
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Organization partner directory — portal access, pending invites, and activity across all
        shipments.
      </p>
      <div className="mt-8">
        <CustomersDirectory />
      </div>
    </div>
  );
}
