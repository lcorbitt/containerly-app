#!/usr/bin/env node
/**
 * Dev-only JSON Cargo–shaped mock. Each GET advances the trip stage for that container.
 *
 * Run: npm run mock:jsoncargo (from frontend/) or: node scripts/mock-jsoncargo-server.mjs
 *
 * Point Edge env at (see supabase/functions/.env.example):
 *   http://host.docker.internal:9999/api/v1  — required for `supabase start` (functions run in Docker)
 *   http://127.0.0.1:9999/api/v1             — only if `supabase functions serve` runs on your host, no Docker
 *   EXTERNAL_TRACKING_API_KEY=dev
 *
 * Container GET echoes `shipping_line` as `shipping_line_request` in `data` (JSONCargo-style query param).
 * BOL GET echoes `shipping_line` as `shipping_line_query` in `data`.
 */

import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.MOCK_JSONCARGO_PORT ?? 9999);

/** @type {Map<string, number>} normalized tracking key -> stage index */
const stageByKey = new Map();

function normTracking(s) {
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * One JSON Cargo `data` row per stage. Includes the full documented field set where it
 * makes sense for the journey (Shanghai → LA); timestamps advance per GET.
 * @see https://jsoncargo.com style Container Details API
 */
function buildStages(containerId) {
  const id = containerId.toUpperCase();

  /** @param {string} stamp @param {Record<string, unknown>} fields */
  function row(stamp, fields) {
    return {
      container_id: id,
      container_type: "40' HIGH CUBE REEFER",
      shipping_line_name: "Mediterranean Shipping Company",
      shipping_line_id: "0015",
      tare: 3900,
      shipped_from: "SHANGHAI, CN",
      shipped_from_terminal: "SHANGHAI CNTS — YANGSHAN PHASE 4",
      shipped_to: "LOS ANGELES, US",
      shipped_to_terminal: "APM TERMINALS PIER 400",
      loading_port: "SHANGHAI, CN",
      discharging_port: "LOS ANGELES, US",
      bill_of_lading: "MEDUSH914201",
      last_vessel_name: "MSC LORETO",
      last_voyage_number: "FY428W",
      current_vessel_name: "MSC LORETO",
      current_voyage_number: "FY428W",
      last_updated: stamp,
      timestamp_of_last_location: stamp,
      last_movement_timestamp: stamp,
      ...fields,
    };
  }

  const oceanSchedule = {
    atd_origin: "2025-01-06 18:00",
    eta_final_destination: "2025-02-05 00:00",
  };

  /** One stage per GET. `container_status` is carrier-facing text only. */
  const stamps = [
    "2025-01-02 08:00",
    "2025-01-03 10:00",
    "2025-01-04 14:00",
    "2025-01-05 09:00",
    "2025-01-05 18:00",
    "2025-01-06 06:00",
    "2025-01-07 00:00",
    "2025-01-10 12:00",
    "2025-01-14 08:00",
    "2025-01-15 22:00",
    "2025-01-18 06:00",
    "2025-01-19 11:00",
    "2025-01-22 07:00",
    "2025-01-23 04:00",
    "2025-01-24 15:00",
    "2025-01-25 09:00",
    "2025-01-26 14:00",
    "2025-01-27 10:00",
    "2025-01-28 08:00",
    "2025-01-29 16:00",
    "2025-01-30 11:00",
    "2025-02-01 09:00",
    "2025-02-02 13:00",
    "2025-02-03 17:00",
  ];

  const T = row;
  const from = "SHANGHAI CNTS — YANGSHAN PHASE 4";
  const toT = "APM TERMINALS PIER 400";

  return [
    T(stamps[0], {
      container_status: "Webhook — carrier data linked",
      last_location: "SHANGHAI, CN",
      last_location_terminal: from,
    }),
    T(stamps[1], {
      container_status: "Booking confirmed",
      last_location: "SHANGHAI, CN",
      last_location_terminal: from,
      next_location: "SHANGHAI, CN — CY",
      next_location_terminal: "YANGSHAN PHASE 4 CY",
      eta_next_destination: "2025-01-05 20:00",
    }),
    T(stamps[2], {
      container_status: "Packed — cartons sealed at shipper warehouse",
      last_location: "KUNSHAN, CN",
      last_location_terminal: "JBS FOODS — EXPORT CFS",
      atd_last_location: "2025-01-04 14:00",
      eta_next_destination: "2025-01-05 12:00",
    }),
    T(stamps[3], {
      container_status: "Gate out empty for loading",
      last_location: "SHANGHAI, CN",
      last_location_terminal: from,
    }),
    T(stamps[4], {
      container_status: "Rail arrival at quay",
      last_location: "SHANGHAI, CN",
      last_location_terminal: "INTERMODAL RAMP — NANHUI",
    }),
    T(stamps[5], {
      container_status: "Loaded on vessel",
      last_location: "SHANGHAI, CN",
      last_location_terminal: from,
      ...oceanSchedule,
    }),
    T(stamps[6], {
      container_status: "Vessel departed origin",
      last_location: "EAST CHINA SEA",
      ...oceanSchedule,
    }),
    T(stamps[7], {
      container_status: "In transit — ocean",
      last_location: "PACIFIC OCEAN",
      ...oceanSchedule,
    }),
    T(stamps[8], {
      container_status: "Discharged at transshipment hub",
      last_location: "BUSAN, KR",
      last_location_terminal: "HMM PUSAN NEW PORT",
      next_location: "BUSAN, KR — feeder berth",
      next_location_terminal: "HMM PUSAN NEW PORT",
      atd_last_location: "2025-01-14 08:00",
      eta_next_destination: "2025-01-15 20:00",
      ...oceanSchedule,
    }),
    T(stamps[9], {
      container_status: "Reloaded on mainline vessel",
      last_location: "BUSAN, KR",
      last_location_terminal: "HMM PUSAN NEW PORT",
      ...oceanSchedule,
    }),
    T(stamps[10], {
      container_status: "Customs exam scheduled (T/S)",
      last_location: "BUSAN, KR",
      last_location_terminal: "CUSTOMS EXAM AREA",
      ...oceanSchedule,
    }),
    T(stamps[11], {
      container_status: "In transit — Pacific main leg",
      last_location: "PACIFIC OCEAN",
      ...oceanSchedule,
    }),
    T(stamps[12], {
      container_status: "Delayed — awaiting berth window",
      last_location: "LOS ANGELES ANCHORAGE",
      ...oceanSchedule,
    }),
    T(stamps[13], {
      container_status: "Vessel arrived POD",
      last_location: "LOS ANGELES, US",
      ...oceanSchedule,
    }),
    T(stamps[14], {
      container_status: "Berthed alongside",
      last_location: "LOS ANGELES, US",
      last_location_terminal: toT,
      ...oceanSchedule,
    }),
    T(stamps[15], {
      container_status: "Discharged from vessel",
      last_location: "LOS ANGELES, US",
      last_location_terminal: toT,
      ...oceanSchedule,
    }),
    T(stamps[16], {
      container_status: "Customs clearance released",
      last_location: "LOS ANGELES, US",
      last_location_terminal: "CBP — LONG BEACH",
      customs_clearance: "2025-01-26 16:00",
      ...oceanSchedule,
    }),
    T(stamps[17], {
      container_status: "CFS available for pickup",
      last_location: "LOS ANGELES, US",
      last_location_terminal: "OFF-DOCK CFS",
      ...oceanSchedule,
    }),
    T(stamps[18], {
      container_status: "Truck dispatched for delivery",
      last_location: "LOS ANGELES, US",
      last_location_terminal: "PIER 400 — OUTGATE",
      next_location: "COMMERCE, CA",
      next_location_terminal: "JBS FOODS — DC 7",
      atd_last_location: "2025-01-29 09:00",
      eta_next_destination: "2025-01-29 18:00",
      ...oceanSchedule,
    }),
    T(stamps[19], {
      container_status: "Delivered to consignee door",
      last_location: "COMMERCE, CA",
      last_location_terminal: "JBS FOODS — DC 7",
      ...oceanSchedule,
    }),
    T(stamps[20], {
      container_status: "Rail arrived at inland ramp",
      last_location: "SAN BERNARDINO, CA",
      last_location_terminal: "BNSF INTERMODAL",
      ...oceanSchedule,
    }),
    T(stamps[21], {
      container_status: "Devanning complete — storage yard",
      last_location: "LOS ANGELES, US",
      last_location_terminal: "APM EMPTY DEPOT",
      ...oceanSchedule,
    }),
    T(stamps[22], {
      container_status: "Empty received at CY",
      last_location: "LOS ANGELES, US",
      last_location_terminal: toT,
      next_location: "LOS ANGELES, US — CY depot",
      next_location_terminal: "APM EMPTY DEPOT",
      atd_last_location: "2025-02-02 11:00",
      eta_next_destination: "2025-02-02 14:00",
      ...oceanSchedule,
    }),
    T(stamps[23], {
      container_status: "Shipment complete",
      last_location: "LOS ANGELES, US",
      last_location_terminal: toT,
      next_location: "LOS ANGELES, US — CY depot",
      next_location_terminal: "APM EMPTY DEPOT",
      atd_last_location: "2025-02-03 08:00",
      eta_next_destination: "2025-02-03 12:00",
      ...oceanSchedule,
    }),
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

  /** Fixed UUID used by enrichment + mock vessel APIs */
  const MOCK_MSC_LORETO_UUID = "a1111111-1111-4111-8111-111111111111";

  const bolMatch = url.pathname.match(/^\/api\/v1\/bill-of-lading\/([^/]+)$/i);
  if (req.method === "GET" && bolMatch) {
    const bol = decodeURIComponent(bolMatch[1]).toUpperCase();
    const bolShippingLineQ = url.searchParams.get("shipping_line");
    const nums =
      bol === "MEDUSH914201" || bol.includes("MEDU")
        ? ["MSCU1234567", "MSCU7654321", "TEMU8880001"]
        : ["MSCU1234567", "CAIU9933760"];
    if (bolShippingLineQ) {
      console.log(`[mock-jsoncargo] GET bill-of-lading/${bol} shipping_line=${bolShippingLineQ}`);
    }
    sendJson(res, 200, {
      data: {
        bill_of_lading: bol,
        shipping_line_name: "Mediterranean Shipping Company",
        shipping_line_id: "0015",
        shipping_line_query: bolShippingLineQ,
        associated_containers: nums.length,
        associated_container_numbers: nums,
        last_updated: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/v1/vessels/live/bulk") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const j = raw ? JSON.parse(raw) : {};
        const uuids = Array.isArray(j.uuids) ? j.uuids : [];
        const vessels = uuids.map((uuid) => ({
          uuid,
          name: uuid === MOCK_MSC_LORETO_UUID ? "MSC LORETO" : "MOCK VESSEL",
          mmsi: "566093000",
          imo: "9525338",
          lat: 22.4 + Math.random() * 0.1,
          lon: 118.2 + Math.random() * 0.1,
          speed: 12.5,
          course: 90,
          heading: 88,
          destination: "USLAX>USLAX",
          dest_port: "LOS ANGELES",
          dest_port_unlocode: "USLAX",
          last_position_UTC: new Date().toISOString(),
          eta_UTC: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        sendJson(res, 200, { data: { total: vessels.length, vessels } });
      } catch {
        sendJson(res, 400, { error: "invalid JSON" });
      }
    });
    return;
  }

  const liveMatch = url.pathname.match(/^\/api\/v1\/vessels\/live\/([^/]+)$/i);
  if (req.method === "GET" && liveMatch) {
    const uuid = decodeURIComponent(liveMatch[1]);
    sendJson(res, 200, {
      data: {
        uuid,
        name: "MSC LORETO",
        mmsi: "566093000",
        imo: "9525338",
        lat: 22.45,
        lon: 118.28,
        speed: 12.4,
        course: 92,
        heading: 90,
        type_specific: "Container Ship",
        destination: "USLAX>USLAX",
        dest_port: "LOS ANGELES",
        dest_port_unlocode: "USLAX",
        dep_port: "SHANGHAI",
        dep_port_unlocode: "CNSHA",
        last_position_UTC: new Date().toISOString(),
        atd_UTC: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        eta_UTC: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        timezone: "GMT",
      },
    });
    return;
  }

  const specsMatch = url.pathname.match(/^\/api\/v1\/vessels\/([^/]+)\/specs$/i);
  if (req.method === "GET" && specsMatch) {
    const uuid = decodeURIComponent(specsMatch[1]);
    sendJson(res, 200, {
      data: {
        uuid,
        name: "MSC LORETO",
        name_ais: "MSC LORETO",
        mmsi: "566093000",
        imo: "9525338",
        country_iso: "SG",
        country_name: "Singapore",
        type_specific: "Container Ship",
        gross_tonnage: 50869,
        deadweight: 68898,
        teu: "4500",
        length: 249.12,
        breadth: 37.4,
        draught_max: 14.2,
        speed_max: 20,
        year_built: "2011",
        home_port: "SINGAPORE",
      },
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/v1/vessels/find") {
    const q = (url.searchParams.get("name") ?? "").trim() || "MSC";
    sendJson(res, 200, {
      data: [
        {
          uuid: MOCK_MSC_LORETO_UUID,
          name: "MSC LORETO",
          name_ais: "MSC LORETO",
          mmsi: "566093000",
          imo: "9525338",
          country_iso: "PA",
          type: "Cargo",
          type_specific: "Container Ship",
        },
        {
          uuid: "b2222222-2222-4222-8222-222222222222",
          name: "MSC LORETO SISTER",
          name_ais: "MSC LORETO SISTER",
          mmsi: "123456789",
          imo: "9525339",
          country_iso: "PA",
          type_specific: "Container Ship",
        },
      ],
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/v1/ports/find") {
    const q = (url.searchParams.get("q") ?? "").trim().toUpperCase();
    sendJson(res, 200, {
      data: [
        {
          uuid: "p1111111-1111-4111-8111-111111111111",
          port_name: q.includes("LOS") ? "LOS ANGELES" : "SHANGHAI",
          country_iso: q.includes("LOS") ? "US" : "CN",
          country_name: q.includes("LOS") ? "United States" : "China",
          unlocode: q.includes("LOS") ? "USLAX" : "CNSHA",
          port_type: "Port",
          lat: q.includes("LOS") ? 33.75 : 31.23,
          lon: q.includes("LOS") ? -118.27 : 121.5,
        },
      ],
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
    const shippingLineRequest = url.searchParams.get("shipping_line");
    const data = {
      ...stages[idx],
      container_id: rawId.toUpperCase(),
      shipping_line_request: shippingLineRequest,
    };
    const envelope = { data };

    if (idx < stages.length - 1) {
      stageByKey.set(key, idx + 1);
    } else {
      stageByKey.set(key, stages.length - 1);
    }

    console.log(
      `[mock-jsoncargo] GET containers/${rawId}${shippingLineRequest ? `?shipping_line=${shippingLineRequest}` : ""} -> stage ${idx}/${stages.length - 1}`,
    );
    sendJson(res, 200, envelope);
    return;
  }

  sendText(res, 404, "Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock JSON Cargo listening on http://127.0.0.1:${PORT}`);
  console.log(`  GET  /api/v1/containers/{tracking_number}`);
  console.log(`  GET  /api/v1/bill-of-lading/{bol}`);
  console.log(`  GET  /api/v1/vessels/find?name=`);
  console.log(`  GET  /api/v1/vessels/live/{uuid}`);
  console.log(`  POST /api/v1/vessels/live/bulk`);
  console.log(`  GET  /api/v1/vessels/{uuid}/specs`);
  console.log(`  GET  /api/v1/ports/find?q=`);
  console.log(`  POST /__dev/reset  body: {"tracking_number":"MSCU1234567"}`);
  console.log(`  GET  /__dev/state?tracking_number=MSCU1234567`);
});
