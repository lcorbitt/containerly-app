export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Account and workspace preferences will live here.
      </p>
    </div>
  );
}
