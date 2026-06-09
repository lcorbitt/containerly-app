import { AlertsInbox } from "./components/AlertsInbox";

export const dynamic = "force-dynamic";

export default function AlertsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Alerts
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Exception inbox — delays, document holds, customer threads, and access requests tied to
        shipment evidence.
      </p>
      <div className="mt-8">
        <AlertsInbox />
      </div>
    </div>
  );
}
