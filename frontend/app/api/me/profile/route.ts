import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMyProfileFieldsQuery,
  updateProfileFullNameForUser,
} from "@/services/profile.server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fields = await fetchMyProfileFieldsQuery(supabase, user.id);
    return NextResponse.json(fields);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load profile" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { full_name?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.full_name;
  const fullName =
    raw === null || raw === undefined
      ? null
      : typeof raw === "string"
        ? raw.trim() || null
        : null;

  try {
    await updateProfileFullNameForUser(supabase, user.id, fullName);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
