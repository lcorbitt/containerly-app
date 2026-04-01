"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { invokeEdgeFunction } from "@/lib/api/edge";

export function NewTrackingForm({
  organizationId,
  onCreated,
}: {
  organizationId: string;
  onCreated: () => void;
}) {
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      await invokeEdgeFunction("create-tracking-request", token, {
        method: "POST",
        body: JSON.stringify({
          organization_id: organizationId,
          container_number: number.trim(),
          run_sync: true,
        }),
      });

      setNumber("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">New tracking request</h2>
      <input
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Container number (e.g. MSCU1234567)"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        required
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Track container"}
      </button>
    </form>
  );
}
