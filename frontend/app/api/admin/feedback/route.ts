import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/services/auth-server.service";
import { fetchAdminFeedbackRows, updateAdminFeedbackStatus } from "@/services/feedback.server";
import { isSuperadminRole } from "@/utils/profile-role";
import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto";

const VALID_CATEGORIES = new Set<FeedbackCategory>(["bug", "feature", "general"]);
const VALID_STATUSES = new Set<FeedbackStatus>(["new", "reviewed", "resolved", "wont_fix"]);

async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const profile = await getSessionProfile(supabase, user.id);
  if (!isSuperadminRole(profile?.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase };
}

export async function GET(request: Request) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");

  const filters: { category?: FeedbackCategory; status?: FeedbackStatus } = {};
  if (category && VALID_CATEGORIES.has(category as FeedbackCategory)) {
    filters.category = category as FeedbackCategory;
  }
  if (status && VALID_STATUSES.has(status as FeedbackStatus)) {
    filters.status = status as FeedbackStatus;
  }

  try {
    const rows = await fetchAdminFeedbackRows(auth.supabase, filters);
    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load feedback" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  let body: { id?: string; status?: FeedbackStatus };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id?.trim();
  const status = body.status;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const row = await updateAdminFeedbackStatus(auth.supabase, { id, status });
    return NextResponse.json({ row });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
