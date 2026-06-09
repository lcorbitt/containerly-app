import { AutomationsPanel } from "./components/AutomationsPanel";

export const dynamic = "force-dynamic";

export default function AutomationsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Automations
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Delay notifications, stale-data reminders, and document guardrails — tuned to how your team
        operates.
      </p>
      <div className="mt-8">
        <AutomationsPanel />
      </div>
    </div>
  );
}
