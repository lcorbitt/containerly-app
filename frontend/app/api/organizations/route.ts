import { NextResponse } from "next/server";
import { getSessionProfile, isSuperadminRole } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function slugFromName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionProfile = await getSessionProfile(supabase, user.id);
  if (!isSuperadminRole(sessionProfile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { name?: string; slug?: string | null; initial_admin_user_id?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slugInput =
    typeof body.slug === "string" && body.slug.trim() !== "" ? body.slug.trim() : null;
  const slug = (slugInput ?? slugFromName(name)).trim();
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const adminUserId =
    typeof body.initial_admin_user_id === "string" && body.initial_admin_user_id.trim() !== ""
      ? body.initial_admin_user_id.trim()
      : user.id;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: service role unavailable" },
      { status: 500 },
    );
  }

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name, slug })
    .select("id")
    .single();

  if (orgErr) {
    const msg = orgErr.message ?? "Could not create organization";
    const status = /duplicate|unique/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const { error: memErr } = await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: adminUserId,
    role: "admin",
  });

  if (memErr) {
    await admin.from("organizations").delete().eq("id", org.id);
    return NextResponse.json(
      { error: memErr.message ?? "Could not add organization admin" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: org.id });
}
