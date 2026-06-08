import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadImporterShipmentMessageThreadsForUser } from "@/services/workspace-actions.server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await loadImporterShipmentMessageThreadsForUser(supabase, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, threads: result.threads });
}
