import type { CreateShipmentBody, ShipmentLineInput } from "@shared/dto/logistics.dto";

/** Form-ready draft produced from an imported CSV, JSON, or spreadsheet row. */
export type ShipmentImportDraft = {
  orderNumber: string;
  carrierBookingNumber: string;
  containerNumber: string;
  customerName: string;
  country: string;
  portOfLoading: string;
  portOfDestination: string;
  etd: string;
  eta: string;
  carrier: string;
  vessel: string;
  voyage: string;
  healthCert: string;
  tradeTerms: string;
};

export type ShipmentBulkImportRow = {
  rowNumber: number;
  draft: ShipmentImportDraft;
};

export type ShipmentBulkImportParseResult = {
  rows: ShipmentBulkImportRow[];
  skipped: Array<{ rowNumber: number; message: string }>;
};

const HEADER_ALIASES: Record<string, keyof ShipmentImportDraft> = {
  order_number: "orderNumber",
  order_no: "orderNumber",
  order: "orderNumber",
  carrier_booking_number: "carrierBookingNumber",
  booking_number: "carrierBookingNumber",
  container_number: "containerNumber",
  container: "containerNumber",
  customer_name: "customerName",
  customer: "customerName",
  country: "country",
  port_of_loading: "portOfLoading",
  pol: "portOfLoading",
  port_of_destination: "portOfDestination",
  pod: "portOfDestination",
  estimated_departure_at: "etd",
  etd: "etd",
  departure: "etd",
  estimated_arrival_at: "eta",
  eta: "eta",
  arrival: "eta",
  freight_booking_carrier: "carrier",
  carrier: "carrier",
  vessel: "vessel",
  voyage: "voyage",
  health_certificate_no: "healthCert",
  health_certificate: "healthCert",
  trade_terms: "tradeTerms",
  incoterms: "tradeTerms",
};

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeDateForInput(value: unknown): string {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function emptyDraft(): ShipmentImportDraft {
  return {
    orderNumber: "",
    carrierBookingNumber: "",
    containerNumber: "",
    customerName: "",
    country: "",
    portOfLoading: "",
    portOfDestination: "",
    etd: "",
    eta: "",
    carrier: "",
    vessel: "",
    voyage: "",
    healthCert: "",
    tradeTerms: "",
  };
}

function applyHeaderField(draft: ShipmentImportDraft, field: keyof ShipmentImportDraft, value: unknown) {
  const s = value == null ? "" : String(value).trim();
  if (!s) return;
  if (field === "etd" || field === "eta") {
    draft[field] = normalizeDateForInput(value);
  } else {
    draft[field] = s;
  }
}

function draftFromFlatRecord(record: Record<string, unknown>): ShipmentImportDraft {
  const draft = emptyDraft();
  for (const [key, value] of Object.entries(record)) {
    const mapped = HEADER_ALIASES[normalizeHeader(key)];
    if (!mapped) continue;
    applyHeaderField(draft, mapped, value);
  }
  return draft;
}

function mergeDrafts(base: ShipmentImportDraft, row: ShipmentImportDraft) {
  if (row.orderNumber.trim()) base.orderNumber = row.orderNumber.trim();
  if (row.carrierBookingNumber.trim()) base.carrierBookingNumber = row.carrierBookingNumber.trim();
  if (row.containerNumber.trim()) base.containerNumber = row.containerNumber.trim();
  if (row.customerName.trim()) base.customerName = row.customerName.trim();
  if (row.country.trim()) base.country = row.country.trim();
  if (row.portOfLoading.trim()) base.portOfLoading = row.portOfLoading.trim();
  if (row.portOfDestination.trim()) base.portOfDestination = row.portOfDestination.trim();
  if (row.etd.trim()) base.etd = row.etd.trim();
  if (row.eta.trim()) base.eta = row.eta.trim();
  if (row.carrier.trim()) base.carrier = row.carrier.trim();
  if (row.vessel.trim()) base.vessel = row.vessel.trim();
  if (row.voyage.trim()) base.voyage = row.voyage.trim();
  if (row.healthCert.trim()) base.healthCert = row.healthCert.trim();
  if (row.tradeTerms.trim()) base.tradeTerms = row.tradeTerms.trim();
}

function recordsFromCsvText(text: string): Record<string, unknown>[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }
  const headers = rows[0]!.map(normalizeHeader);
  const records: Record<string, unknown>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]!;
    if (!cells.some((c) => String(c).trim() !== "")) continue;
    const record: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      record[h] = cells[idx] ?? "";
    });
    records.push(record);
  }
  return records;
}

async function recordsFromXlsxBuffer(buffer: ArrayBuffer): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Spreadsheet has no worksheets.");
  const sheet = wb.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  return rows.filter((row) => Object.values(row).some((v) => v != null && String(v).trim() !== ""));
}

export async function readShipmentImportRecords(file: File): Promise<{
  fileName: string;
  records: Record<string, unknown>[];
}> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const records = await recordsFromXlsxBuffer(buffer);
    if (records.length === 0) throw new Error("Spreadsheet has no data rows.");
    return { fileName: file.name, records };
  }

  const text = await file.text();
  const trimmed = text.trim();
  if (!trimmed) throw new Error("File is empty.");

  if (lower.endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("Invalid JSON file.");
    }
    if (Array.isArray(parsed)) {
      const records = parsed.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
      if (records.length === 0) throw new Error("JSON array must include at least one shipment object.");
      return { fileName: file.name, records };
    }
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const list = obj.shipments ?? obj.rows;
      if (Array.isArray(list)) {
        const records = list.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
        if (records.length === 0) throw new Error("JSON shipments array is empty.");
        return { fileName: file.name, records };
      }
      return { fileName: file.name, records: [obj] };
    }
    throw new Error("JSON must be an object or array of shipment rows.");
  }

  return { fileName: file.name, records: recordsFromCsvText(trimmed) };
}

function bulkDraftFromRecord(record: Record<string, unknown>): ShipmentImportDraft {
  const header =
    record.header && typeof record.header === "object"
      ? (record.header as Record<string, unknown>)
      : record;
  return draftFromFlatRecord(header);
}

/** Each spreadsheet/CSV row becomes one shipment (no line merging across rows). */
export function parseShipmentBulkImportRecords(records: Record<string, unknown>[]): ShipmentBulkImportParseResult {
  const rows: ShipmentBulkImportRow[] = [];
  const skipped: Array<{ rowNumber: number; message: string }> = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const draft = bulkDraftFromRecord(record);
    if (!draft.orderNumber.trim()) {
      skipped.push({ rowNumber, message: "Missing order number." });
      return;
    }
    if (!draft.carrierBookingNumber.trim()) {
      skipped.push({ rowNumber, message: "Missing carrier booking number." });
      return;
    }
    if (!draft.containerNumber.trim()) {
      skipped.push({ rowNumber, message: "Missing container number." });
      return;
    }
    rows.push({ rowNumber, draft });
  });

  if (rows.length === 0) {
    throw new Error(
      skipped.length > 0
        ? "No valid shipment rows found. Each row needs order number, booking number, and container number."
        : "File has no shipment rows.",
    );
  }

  return { rows, skipped };
}

export function draftToCreateShipmentBody(organizationId: string, draft: ShipmentImportDraft): CreateShipmentBody {
  const identityLine: ShipmentLineInput = {
    order_number: draft.orderNumber.trim(),
    carrier_booking_number: draft.carrierBookingNumber.trim(),
    container_number: draft.containerNumber.trim(),
    customer_name: draft.customerName.trim() || null,
    country: draft.country.trim() || null,
    sort_order: 0,
  };

  return {
    organization_id: organizationId,
    header: {
      order_number: draft.orderNumber.trim(),
      carrier_booking_number: draft.carrierBookingNumber.trim(),
      container_number: draft.containerNumber.trim(),
      customer_name: draft.customerName.trim() || null,
      country: draft.country.trim() || null,
      port_of_loading: draft.portOfLoading.trim() || null,
      port_of_destination: draft.portOfDestination.trim() || null,
      estimated_departure_at: draft.etd ? new Date(draft.etd).toISOString() : null,
      estimated_arrival_at: draft.eta ? new Date(draft.eta).toISOString() : null,
      freight_booking_carrier: draft.carrier.trim() || null,
      vessel: draft.vessel.trim() || null,
      voyage: draft.voyage.trim() || null,
      health_certificate_no: draft.healthCert.trim() || null,
      trade_terms: draft.tradeTerms.trim() || null,
    },
    lines: [identityLine],
  };
}

export async function parseShipmentBulkImportFile(file: File): Promise<ShipmentBulkImportParseResult> {
  const { records } = await readShipmentImportRecords(file);
  return parseShipmentBulkImportRecords(records);
}

/** Minimal RFC-style CSV row parser (handles quoted fields). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function parseCsv(text: string): ShipmentImportDraft {
  const records = recordsFromCsvText(text);
  const merged = emptyDraft();
  for (const record of records) {
    mergeDrafts(merged, draftFromFlatRecord(record));
  }
  if (!merged.orderNumber.trim()) {
    throw new Error("Imported file must include an order number.");
  }
  return merged;
}

function parseJson(text: string): ShipmentImportDraft {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON must be an object.");
  }
  const obj = parsed as Record<string, unknown>;
  const header = (obj.header && typeof obj.header === "object" ? obj.header : obj) as Record<string, unknown>;
  const draft = draftFromFlatRecord(header);
  if (!draft.orderNumber.trim()) {
    throw new Error("Imported file must include an order number.");
  }
  return draft;
}

export function parseShipmentImportFile(text: string, fileName: string): ShipmentImportDraft {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("File is empty.");
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json")) return parseJson(trimmed);
  if (lower.endsWith(".csv")) return parseCsv(trimmed);
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return parseJson(trimmed);
  return parseCsv(trimmed);
}

export async function parseShipmentImportFileAsync(file: File): Promise<ShipmentImportDraft> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const bulk = await parseShipmentBulkImportFile(file);
    if (bulk.rows.length !== 1) {
      throw new Error(
        bulk.rows.length === 0
          ? "Spreadsheet has no valid shipment rows."
          : `Spreadsheet has ${bulk.rows.length} shipments. Use bulk import to create them all.`,
      );
    }
    return bulk.rows[0]!.draft;
  }
  const text = await file.text();
  return parseShipmentImportFile(text, file.name);
}

export const SHIPMENT_IMPORT_CSV_TEMPLATE = `order_number,carrier_booking_number,container_number,customer_name,country,port_of_loading,port_of_destination,estimated_departure_at,estimated_arrival_at,freight_booking_carrier,vessel,voyage,health_certificate_no,trade_terms
PO-44201-A,BK-SE601W,MSKU1234567,Costco Wholesale,US,Santos BR,Long Beach US,2026-06-15,2026-07-10,MSC,MSC Sealand,SE601W,HC-BR-2026-0142,CIF
`;

export const SHIPMENT_BULK_IMPORT_CSV_TEMPLATE = `order_number,carrier_booking_number,container_number,customer_name,country,port_of_loading,port_of_destination,estimated_departure_at,estimated_arrival_at,freight_booking_carrier,vessel,voyage,health_certificate_no,trade_terms
PO-44201-A,BK-SE601W,MSKU1234567,Costco Wholesale,US,Santos BR,Long Beach US,2026-06-15,2026-07-10,MSC,MSC Sealand,SE601W,HC-BR-2026-0142,CIF
PO-44202-A,BK-SE602W,MSKU1234568,Walmart Inc,US,Santos BR,Oakland US,2026-06-20,2026-07-15,MSC,MSC Sealand,SE602W,HC-BR-2026-0143,CIF
PO-44203-A,BK-MO701E,TGHU9876543,Target Corp,US,Paranagua BR,Seattle US,2026-06-22,2026-07-18,MAERSK,MAERSK Ohio,MO701E,HC-BR-2026-0144,FOB
`;

export function downloadShipmentImportTemplate() {
  const blob = new Blob([SHIPMENT_IMPORT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shipment-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadShipmentBulkImportTemplate(format: "csv" | "xlsx" = "xlsx") {
  if (format === "csv") {
    const blob = new Blob([SHIPMENT_BULK_IMPORT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shipment-bulk-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const XLSX = await import("xlsx");
  const sheetRows = parseCsvRows(SHIPMENT_BULK_IMPORT_CSV_TEMPLATE);
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Shipments");
  XLSX.writeFile(wb, "shipment-bulk-import-template.xlsx");
}
