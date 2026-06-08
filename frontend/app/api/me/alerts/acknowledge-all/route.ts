import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acknowledgeAllMyAlerts } from "@/services/alert.server";

export async function PATCH() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const acknowledged = await acknowledgeAllMyAlerts(supabase, user.id);
  return NextResponse.json({ ok: true, acknowledged });
}
