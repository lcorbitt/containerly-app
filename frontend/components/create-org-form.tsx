"use client";

import { useState } from "react";

export function CreateOrgForm({ onCreated }: { onCreated: (orgId: string) => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || null,
        }),
      });
      const payload = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? res.statusText);
      }
      if (!payload.id) throw new Error("Missing organization id");
      onCreated(payload.id);
      setName("");
      setSlug("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Create organization</h2>
      <input
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Company name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Slug (optional)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
