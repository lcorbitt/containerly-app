import { requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import {
  buildTrackingDashboardInsightsBundle,
  buildTrackingDashboardReportsBundle,
  resolveOrgDashboardAccess,
} from "@services/tracking/dashboard.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organization_id")?.trim() ?? "";
    const include = url.searchParams.get("include") ?? url.searchParams.get("scope") ?? "";

    if (!organizationId || !UUID_RE.test(organizationId)) {
      return jsonResponse({ error: "Invalid organization_id" }, { status: 400 });
    }
    if (include !== "insights" && include !== "reports" && include !== "both") {
      return jsonResponse({ error: "include must be insights, reports, or both" }, { status: 400 });
    }

    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const access = await resolveOrgDashboardAccess(userClient, organizationId, auth.userId);

    if (include === "both") {
      if (!access.canIncludeOrgInsights) {
        return jsonResponse({ error: "Forbidden" }, { status: 403 });
      }
      if (!access.canIncludeOrgMetrics) {
        return jsonResponse({ error: "Forbidden" }, { status: 403 });
      }
      const [insightsBundle, reportsBundle] = await Promise.all([
        buildTrackingDashboardInsightsBundle(userClient, organizationId),
        buildTrackingDashboardReportsBundle(userClient, organizationId),
      ]);
      return jsonResponse({ insights: insightsBundle, reports: reportsBundle });
    }

    if (include === "insights") {
      if (!access.canIncludeOrgInsights) {
        return jsonResponse({ error: "Forbidden" }, { status: 403 });
      }
      const bundle = await buildTrackingDashboardInsightsBundle(userClient, organizationId);
      return jsonResponse({ bundle });
    }

    if (!access.canIncludeOrgMetrics) {
      return jsonResponse({ error: "Forbidden" }, { status: 403 });
    }
    const bundle = await buildTrackingDashboardReportsBundle(userClient, organizationId);
    return jsonResponse({ bundle });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
