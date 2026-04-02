"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { invokeEdgeFunction } from "@/lib/api/edge";
import type { TrackingRequest } from "@/types/database";

/** Must match stage count in `scripts/mock-jsoncargo-server.mjs`. */
const MOCK_TRIP_STAGES = 6;

const mockControlBase = process.env.NEXT_PUBLIC_MOCK_JSONCARGO_URL?.replace(/\/$/, "") ?? "";

export function MockJourneySimulator({
  organizationId,
  requests,
  onComplete,
}: {
  organizationId: string;
  requests: TrackingRequest[];
  onComplete: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(requests[0]?.id ?? "");
  const [delaySec, setDelaySec] = useState(20);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requests.length === 0) {
      setSelectedId("");
      return;
    }
    if (!requests.some((r) => r.id === selectedId)) {
      setSelectedId(requests[0]!.id);
    }
  }, [requests, selectedId]);

  const selected = requests.find((r) => r.id === selectedId);

  async function run() {
    if (!selected) {
      setError("Choose a tracking request that uses your mock container number.");
      return;
    }
    setError(null);
    setRunning(true);
    setLog([]);
    const lines: string[] = [];
    try {
      if (mockControlBase) {
        const rr = await fetch(`${mockControlBase}/__dev/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracking_number: selected.container_number }),
        });
        if (!rr.ok) {
          throw new Error(`Mock reset failed (${rr.status}). Is the mock server running?`);
        }
        lines.push("Mock server: trip reset to first stage.");
        setLog([...lines]);
      } else {
        lines.push(
          "No NEXT_PUBLIC_MOCK_JSONCARGO_URL — skipping reset (mock may start mid-journey).",
        );
        setLog([...lines]);
      }

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      for (let i = 0; i < MOCK_TRIP_STAGES; i++) {
        lines.push(`Stage ${i + 1}/${MOCK_TRIP_STAGES}: sync-container (force)…`);
        setLog([...lines]);

        await invokeEdgeFunction("sync-container", token, {
          method: "POST",
          body: JSON.stringify({
            organization_id: organizationId,
            container_number: selected.container_number,
            tracking_request_id: selected.id,
            force: true,
          }),
        });

        lines.push(`Stage ${i + 1} applied.`);
        setLog([...lines]);

        if (i < MOCK_TRIP_STAGES - 1) {
          await new Promise((r) => setTimeout(r, delaySec * 1000));
        }
      }

      lines.push("Done — refresh the table to see status and events.");
      setLog([...lines]);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <h2 className="text-sm font-medium text-amber-950 dark:text-amber-100">
        Simulate journey (dev)
      </h2>
      <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
        Runs several forced syncs so your mock API returns each leg of a trip. Does not depend on
        cron: each step calls <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">sync-container</code> with{" "}
        <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">force: true</code>.
        Point Edge secrets at the local mock server and use the same container number you track.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-amber-950 dark:text-amber-100">
          Tracking request
          <select
            className="max-w-xs rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-900 dark:bg-zinc-950"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={running || requests.length === 0}
          >
            {requests.length === 0 ? (
              <option value="">No tracking requests yet — add one above</option>
            ) : (
              requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.container_number} — {r.status}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-amber-950 dark:text-amber-100">
          Seconds between stages
          <input
            type="number"
            min={5}
            max={120}
            className="w-24 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-900 dark:bg-zinc-950"
            value={delaySec}
            onChange={(e) => setDelaySec(Number(e.target.value) || 20)}
            disabled={running}
          />
        </label>
        <button
          type="button"
          disabled={running || requests.length === 0 || !selectedId}
          onClick={() => void run()}
          className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-amber-50 disabled:opacity-50 dark:bg-amber-700"
        >
          {running ? "Running…" : "Run mock journey"}
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {log.length > 0 ? (
        <ul className="mt-3 max-h-40 overflow-y-auto font-mono text-xs text-amber-950/90 dark:text-amber-100/90">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Explicit opt-in for non-dev builds (e.g. staging). */
export function isMockJourneyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_JOURNEY === "true";
}

/** Show the simulate-journey panel: always in `next dev`, or when the env flag is set. */
export function shouldShowMockJourneyPanel(): boolean {
  return process.env.NODE_ENV === "development" || isMockJourneyEnabled();
}
