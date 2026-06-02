import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchOrganizationPerformanceSettings,
  updateOrganizationPerformanceSettings,
} from "@/services/organization.server";
import { parseOrgPerformanceSettings } from "@/utils/org-performance-settings";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await fetchOrganizationPerformanceSettings(supabase, orgId);
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Load failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const settings = parseOrgPerformanceSettings(body);

  try {
    const saved = await updateOrganizationPerformanceSettings(supabase, {
      organizationId: orgId,
      settings,
    });
    return NextResponse.json({ ok: true, settings: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
