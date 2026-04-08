import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileDisplayNameMapForUserIds } from "@/services/profile.server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userIds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.userIds;
  const userIds = Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];
  if (userIds.length === 0) {
    return NextResponse.json({ map: {} });
  }

  try {
    const map = await fetchProfileDisplayNameMapForUserIds(supabase, userIds);
    return NextResponse.json({ map });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lookup failed" },
      { status: 400 },
    );
  }
}
