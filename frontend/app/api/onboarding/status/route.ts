import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOnboardingStatusForUser } from "@/services/onboarding.server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await fetchOnboardingStatusForUser(supabase);
    return NextResponse.json(status);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load onboarding status" },
      { status: 500 },
    );
  }
}
