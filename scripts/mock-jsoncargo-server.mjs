#!/usr/bin/env node
/**
 * Dev-only JSON Cargo–shaped mock. Each GET advances the trip stage for that container.
 *
 * Run: npm run mock:jsoncargo (from frontend/) or: node scripts/mock-jsoncargo-server.mjs
 *
 * Point Edge env at:
 *   EXTERNAL_TRACKING_API_URL=http://host.docker.internal:9999/api/v1   (Supabase CLI Docker on Mac/Win)
 *   EXTERNAL_TRACKING_API_URL=http://127.0.0.1:9999/api/v1              (functions serve on host)
 *   EXTERNAL_TRACKING_API_KEY=dev
 *
 * Optional: EXTERNAL_TRACKING_SHIPPING_LINE=MSC — mock ignores query but your edge will send it.
 */

import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.MOCK_JSONCARGO_PORT ?? 9999);

/** @type {Map<string, number>} normalized tracking key -> stage index */
const stageByKey = new Map();

function normTracking(s) {
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function buildStages(containerId) {
  const id = containerId.toUpperCase();
  const base = {
    container_type: "40' HIGH CUBE REEFER",
    shipping_line_name: "Mediterranean Shipping Company",
    shipping_line_id: "0015",
    tare: 3900,
    shipped_from: "GUAYAQUIL, EC",
    shipped_from_terminal: "NAPORTEC TERMINAL - BANANAPUERTO ",
    shipped_to: "TRIPOLI, LY",
    shipped_to_terminal: "SPCO ( SOCIALIST PORTS CO UNDER MINISTRY OF TRANSPORT ) ",
    loading_port: "GUAYAQUIL, EC",
    discharging_port: "TRIPOLI, LY",
    bill_of_lading: "MEDUGY914103",
    last_vessel_name: "MSC LENA F",
    last_voyage_number: "YF432A",
    current_vessel_name: "MSC LENA F",
    current_voyage_number: "YF432A",
    container_id: id,
  };

  return [
    {
      ...base,
      container_status: "Booking confirmed",
      last_location: "GUAYAQUIL, EC",
      last_location_terminal: base.shipped_from_terminal,
      next_location: "GUAYAQUIL, EC - CY",
      last_updated: "2024-07-05 09:00",
      timestamp_of_last_location: "2024-07-05 09:00",
      last_movement_timestamp: "2024-07-05 09:00",
    },
    {
      ...base,
      container_status: "Gate out empty for loading",
      last_location: "GUAYAQUIL, EC",
      last_location_terminal: base.shipped_from_terminal,
      atd_origin: "2024-07-08 14:00",
      last_updated: "2024-07-08 14:00",
      timestamp_of_last_location: "2024-07-08 14:00",
      last_movement_timestamp: "2024-07-08 14:00",
    },
    {
      ...base,
      container_status: "Loaded on vessel",
      last_location: "GUAYAQUIL, EC",
      last_location_terminal: base.shipped_from_terminal,
      atd_origin: "2024-07-09 00:00",
      eta_final_destination: "2024-08-10 00:00",
      last_updated: "2024-07-09 06:00",
      timestamp_of_last_location: "2024-07-09 06:00",
      last_movement_timestamp: "2024-07-09 06:00",
    },
    {
      ...base,
      container_status: "In transit",
      last_location: "AT SEA",
      last_location_terminal: null,
      atd_origin: "2024-07-09 00:00",
      eta_final_destination: "2024-08-10 00:00",
      last_updated: "2024-07-20 12:00",
      timestamp_of_last_location: "2024-07-20 12:00",
      last_movement_timestamp: "2024-07-20 12:00",
    },
    {
      ...base,
      container_status: "Vessel arrived — discharging",
      last_location: "TRIPOLI, LY",
      last_location_terminal: base.shipped_to_terminal,
      next_location: "TRIPOLI, LY - CY Depot",
      next_location_terminal: "AL MOURSSALAT CONTAINER YARD",
      atd_last_location: "2024-08-11 00:00",
      eta_next_destination: "2024-08-20 00:00",
      last_updated: "2024-08-12 10:00",
      timestamp_of_last_location: "2024-08-12 10:00",
      last_movement_timestamp: "2024-08-12 10:00",
    },
    {
      ...base,
      container_status: "Empty received at CY",
      last_location: "TRIPOLI, LY",
      last_location_terminal: "SPCO ( SOCIALIST PORTS CO UNDER MINISTRY OF TRANSPORT ) ",
      next_location: "TRIPOLI, LY - CY Depot",
      next_location_terminal: "AL MOURSSALAT CONTAINER YARD",
      atd_last_location: "2024-08-11 00:00",
      eta_next_destination: "2024-08-20 00:00",
      timestamp_of_last_location: "2024-08-13 00:00",
      last_movement_timestamp: "2024-08-17 00:00",
      customs_clearance: "2024-08-14 00:00",
      last_updated: "2024-09-09 18:34",
    },
  ];
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, apikey",
  });
  res.end(body);
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
  res.end(text);
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, apikey",
    });
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "POST" && url.pathname === "/__dev/reset") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const j = raw ? JSON.parse(raw) : {};
        const key = normTracking(j.tracking_number ?? j.container_number ?? "");
        if (!key) {
          sendJson(res, 400, { error: "tracking_number required" });
          return;
        }
        stageByKey.set(key, 0);
        sendJson(res, 200, { ok: true, tracking_number: key, stage: 0 });
      } catch {
        sendJson(res, 400, { error: "invalid JSON" });
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/__dev/state") {
    const t = url.searchParams.get("tracking_number") ?? "";
    const key = normTracking(t);
    const stages = key ? buildStages(key) : [];
    sendJson(res, 200, {
      tracking_number: key || null,
      stage: key ? (stageByKey.get(key) ?? 0) : null,
      total_stages: stages.length,
    });
    return;
  }

  const m = url.pathname.match(/^\/api\/v1\/containers\/([^/]+)$/);
  if (req.method === "GET" && m) {
    const rawId = decodeURIComponent(m[1]);
    const key = normTracking(rawId);
    const stages = buildStages(rawId);
    let idx = stageByKey.get(key) ?? 0;
    if (idx >= stages.length) idx = stages.length - 1;
    const data = { ...stages[idx], container_id: rawId.toUpperCase() };
    const envelope = { data };

    if (idx < stages.length - 1) {
      stageByKey.set(key, idx + 1);
    } else {
      stageByKey.set(key, stages.length - 1);
    }

    console.log(`[mock-jsoncargo] GET containers/${rawId} -> stage ${idx}/${stages.length - 1}`);
    sendJson(res, 200, envelope);
    return;
  }

  sendText(res, 404, "Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock JSON Cargo listening on http://127.0.0.1:${PORT}`);
  console.log(`  GET  /api/v1/containers/{tracking_number}`);
  console.log(`  POST /__dev/reset  body: {"tracking_number":"MSCU1234567"}`);
  console.log(`  GET  /__dev/state?tracking_number=MSCU1234567`);
});
