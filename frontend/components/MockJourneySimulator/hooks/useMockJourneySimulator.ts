"use client";

import { useEffect, useRef, useState } from "react";
import { syncContainer } from "@/services/tracking.service";
import type { TrackingRequest } from "@/types/database";
import { getMockControlBase, waitOrAbort } from "../utils";
import { MOCK_TRIP_STAGES_FALLBACK } from "../constants";

const mockControlBase = getMockControlBase();

export function useMockJourneySimulator({
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

      let totalStages = MOCK_TRIP_STAGES_FALLBACK;
      if (mockControlBase && selected) {
        try {
          const qs = new URLSearchParams({
            tracking_number: selected.container_number,
          });
          const stRes = await fetch(`${mockControlBase}/__dev/state?${qs.toString()}`);
          if (stRes.ok) {
            const stJson = (await stRes.json()) as { total_stages?: number };
            if (typeof stJson.total_stages === "number" && stJson.total_stages > 0) {
              totalStages = stJson.total_stages;
            }
          }
        } catch {
          /* keep fallback */
        }
      }

      for (let i = 0; i < totalStages; i++) {
        if (stopRequestedRef.current) {
          lines.push(`Stopped after ${i} stage(s).`);
          setLog([...lines]);
          return;
        }

        lines.push(`Stage ${i + 1}/${totalStages}: sync-container (force)…`);
        setLog([...lines]);

        await syncContainer({
          organization_id: organizationId,
          container_number: selected.container_number,
          tracking_request_id: selected.id,
          force: true,
        });

        lines.push(`Stage ${i + 1} applied.`);
        setLog([...lines]);

        if (i < totalStages - 1) {
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

  return {
    selectedId,
    setSelectedId,
    delaySec,
    setDelaySec,
    running,
    log,
    error,
    resetting,
    selected,
    requests,
    run,
    stopSimulation,
    resetMockTrip,
  };
}
