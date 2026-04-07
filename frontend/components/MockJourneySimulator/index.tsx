"use client";

import type { TrackingRequest } from "@/types/database";
import { useMockJourneySimulator } from "./hooks/useMockJourneySimulator";

export { isMockJourneyEnabled, shouldShowMockJourneyPanel } from "./utils";

export function MockJourneySimulator({
  organizationId,
  requests,
  onComplete,
  /** When false (e.g. header modal), omit outer card chrome; host supplies dialog title. */
  showChrome = true,
}: {
  organizationId: string;
  requests: TrackingRequest[];
  onComplete: () => void;
  showChrome?: boolean;
}) {
  const {
    selectedId,
    setSelectedId,
    delaySec,
    setDelaySec,
    running,
    log,
    error,
    resetting,
    run,
    stopSimulation,
    resetMockTrip,
  } = useMockJourneySimulator({ organizationId, requests, onComplete });

  const shell = showChrome
    ? "rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
    : "space-y-3";

  return (
    <section className={shell}>
      {showChrome ? (
        <h2 className="text-sm font-medium text-amber-950 dark:text-amber-100">
          Simulate journey (dev)
        </h2>
      ) : null}
      <p
        className={
          showChrome
            ? "mt-1 text-xs text-amber-900/80 dark:text-amber-200/80"
            : "text-xs text-amber-900/80 dark:text-amber-200/80"
        }
      >
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

      <div className={`flex flex-wrap items-end gap-3 ${showChrome ? "mt-3" : ""}`}>
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
          className="rounded-lg cursor-pointer bg-amber-900 px-4 py-2 text-sm font-medium text-amber-50 disabled:opacity-50 dark:bg-amber-700"
        >
          {running ? "Simulating…" : "Simulate journey"}
        </button>
        <button
          type="button"
          disabled={!running}
          onClick={stopSimulation}
          className="rounded-lg cursor-pointer border border-amber-800 px-4 py-2 text-sm font-medium text-amber-950 disabled:opacity-40 dark:border-amber-600 dark:text-amber-100"
        >
          Stop
        </button>
        <button
          type="button"
          disabled={running || resetting || requests.length === 0 || !selectedId}
          onClick={() => void resetMockTrip()}
          className="rounded-lg cursor-pointer border border-amber-800 px-4 py-2 text-sm font-medium text-amber-950 disabled:opacity-40 dark:border-amber-600 dark:text-amber-100"
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
