import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchDocumentQueuePage,
  type DocumentQueueFilter,
} from "@/services/shipment.server";
import type { OperatorShipmentScope } from "@/services/shipment.service";

const WORKFLOW_FILTERS = new Set<DocumentQueueFilter>([
  "all",
  "pending_drafts",
  "awaiting_review",
  "approved",
  "rejected",
  "originals_sent",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const { searchParams } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 25) || 25));
  const scope = (searchParams.get("scope") ?? "all") as OperatorShipmentScope;
  const rawFilter = searchParams.get("workflowFilter") ?? "all";
  const workflowFilter = WORKFLOW_FILTERS.has(rawFilter as DocumentQueueFilter)
    ? (rawFilter as DocumentQueueFilter)
    : "all";
  const search = searchParams.get("search") ?? "";

  try {
    const result = await fetchDocumentQueuePage(supabase, {
      organizationId: orgId,
      userId: user.id,
      scope,
      workflowFilter,
      search,
      page,
      pageSize,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Load failed" },
      { status: 400 },
    );
  }
}
