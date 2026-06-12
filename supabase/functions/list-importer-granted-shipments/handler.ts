import { requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { fetchImporterGrantedShipmentsPage } from "@services/shipment/list.service";
import { parseOperatorShipmentDateRangeFilter } from "@shared/operator-shipment-date-filters";
import {
  normalizeImporterGrantedShipmentSortColumn,
  type SortDirection,
} from "@shared/importer-shipment-sort";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 0) || 0);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 25) || 25));
    const sortColumn = normalizeImporterGrantedShipmentSortColumn(url.searchParams.get("sortColumn"));
    const sortDirection = (url.searchParams.get("sortDirection") === "asc" ? "asc" : "desc") as SortDirection;
    const search = url.searchParams.get("search") ?? "";
    const dateRangeFilter = parseOperatorShipmentDateRangeFilter({
      etaFrom: url.searchParams.get("etaFrom"),
      etaTo: url.searchParams.get("etaTo"),
      etdFrom: url.searchParams.get("etdFrom"),
      etdTo: url.searchParams.get("etdTo"),
    });

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const result = await fetchImporterGrantedShipmentsPage(userClient, {
      userId: auth.userId,
      page,
      pageSize,
      sortColumn,
      sortDirection,
      search,
      dateRangeFilter,
    });

    return jsonResponse(result);
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
