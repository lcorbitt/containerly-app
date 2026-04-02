"use client";

import { useEffect, useRef, useState } from "react";
import { syncContainerAction } from "@/app/actions/edge-functions";
import type { TrackingRequest } from "@/types/database";

/** Must match stage count in `scripts/mock-jsoncargo-server.mjs`. */
const MOCK_TRIP_STAGES = 6;

/**
 * Base URL for browser → mock server control routes (`/__dev/reset`).
 * Edge Functions use `EXTERNAL_TRACKING_API_URL` in supabase/functions/.env instead.
 * In development, default to localhost so reset works without extra env.
 */
function getMockControlBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MOCK_JSONCARGO_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:9999";
  }
  return "";
}

const mockControlBase = getMockControlBase();

async function waitOrAbort(totalMs: number, cancelledRef: React.MutableRefObject<boolean>): Promise<void> {
  const step = 250;
  let waited = 0;
  while (waited < totalMs) {
    if (cancelledRef.current) return;
    const slice = Math.min(step, totalMs - waited);
    await new Promise((r) => setTimeout(r, slice));
    waited += slice;
  }
}

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
  const [resetting, setResetting] = useState(false);
  const stopRequestedRef = useRef(false);

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

  async function resetMockTrip(): Promise<void> {
    if (!selected) {
      setError("Choose a tracking request first.");
      return;
    }
    if (!mockControlBase) {
      setError(
        "Set NEXT_PUBLIC_MOCK_JSONCARGO_URL (e.g. http://127.0.0.1:9999) so the browser can call the mock reset API.",
      );
      return;
    }
    setError(null);
    setResetting(true);
    try {
      const rr = await fetch(`${mockControlBase}/__dev/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: selected.container_number }),
      });
      if (!rr.ok) {
        throw new Error(`Mock reset failed (${rr.status}). Is the mock server running on :9999?`);
      }
      setLog((prev) => [...prev, `Reset: mock trip back to stage 0 for ${selected.container_number}.`]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  function stopSimulation() {
    stopRequestedRef.current = true;
    setLog((prev) => [...prev, "Stop requested — finishing current step, then halting."]);
  }

  async function run() {
    if (!selected) {
      setError("Choose a tracking request that uses your mock container number.");
      return;
    }
    setError(null);
    stopRequestedRef.current = false;
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
          "No mock control URL (set NEXT_PUBLIC_MOCK_JSONCARGO_URL outside development) — starting mid-journey is possible.",
        );
        setLog([...lines]);
      }

      for (let i = 0; i < MOCK_TRIP_STAGES; i++) {
        if (stopRequestedRef.current) {
          lines.push(`Stopped after ${i} stage(s).`);
          setLog([...lines]);
          return;
        }

        lines.push(`Stage ${i + 1}/${MOCK_TRIP_STAGES}: sync-container (force)…`);
        setLog([...lines]);

        await syncContainerAction({
          organization_id: organizationId,
          container_number: selected.container_number,
          tracking_request_id: selected.id,
          force: true,
        });

        lines.push(`Stage ${i + 1} applied.`);
        setLog([...lines]);

        if (i < MOCK_TRIP_STAGES - 1) {
          await waitOrAbort(delaySec * 1000, stopRequestedRef);
          if (stopRequestedRef.current) {
            lines.push(`Stopped after stage ${i + 1}.`);
            setLog([...lines]);
            return;
          }
        }
      }

      lines.push("Done — refresh the table to see status and events.");
      setLog([...lines]);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setRunning(false);
      stopRequestedRef.current = false;
    }
  }

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <h2 className="text-sm font-medium text-amber-950 dark:text-amber-100">
        Simulate journey (dev)
      </h2>
      <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
        Each step calls the <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">sync-container</code> Edge
        Function with <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">force: true</code>. Configure
        the Edge env for the mock API (
        <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">EXTERNAL_TRACKING_API_URL</code> in{" "}
        <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">supabase/functions/.env</code>).{" "}
        <strong>Reset mock</strong> / auto-reset before a run use your browser → mock on{" "}
        <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">NEXT_PUBLIC_MOCK_JSONCARGO_URL</code> (defaults
        to <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">http://127.0.0.1:9999</code> in{" "}
        <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">next dev</code>).
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
          {running ? "Simulating…" : "Simulate journey"}
        </button>
        <button
          type="button"
          disabled={!running}
          onClick={stopSimulation}
          className="rounded-lg border border-amber-800 px-4 py-2 text-sm font-medium text-amber-950 disabled:opacity-40 dark:border-amber-600 dark:text-amber-100"
        >
          Stop
        </button>
        <button
          type="button"
          disabled={running || resetting || requests.length === 0 || !selectedId}
          onClick={() => void resetMockTrip()}
          className="rounded-lg border border-amber-800 px-4 py-2 text-sm font-medium text-amber-950 disabled:opacity-40 dark:border-amber-600 dark:text-amber-100"
        >
          {resetting ? "Resetting…" : "Reset mock"}
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
