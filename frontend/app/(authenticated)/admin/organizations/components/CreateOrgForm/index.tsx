"use client";

import { useCreateOrgForm } from "./hooks/useCreateOrgForm";

export function CreateOrgForm({ onCreated }: { onCreated: (orgId: string) => void }) {
  const f = useCreateOrgForm(onCreated);

  return (
    <form
      onSubmit={(e) => void f.submit(e)}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Create organization</h2>
      <input
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Company name"
        value={f.name}
        onChange={(e) => f.setName(e.target.value)}
        required
      />
      <input
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Slug (optional)"
        value={f.slug}
        onChange={(e) => f.setSlug(e.target.value)}
      />
      {f.error ? <p className="text-sm text-red-600">{f.error}</p> : null}
      <button
        type="submit"
        disabled={f.loading}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {f.loading ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
