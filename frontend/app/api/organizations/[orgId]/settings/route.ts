import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateOrganizationNameAndSlug } from "@/services/organization.server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; slug?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  try {
    await updateOrganizationNameAndSlug(supabase, orgId, name, slug);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
