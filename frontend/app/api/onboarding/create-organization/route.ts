import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeSignupOrganizationForUser } from "@/services/onboarding.server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    slug?: string | null;
    team_size?: string | null;
    monthly_shipment_volume?: string | null;
  };
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
  const teamSize =
    typeof body.team_size === "string" && body.team_size.trim() !== ""
      ? body.team_size.trim()
      : null;
  const monthlyShipmentVolume =
    typeof body.monthly_shipment_volume === "string" && body.monthly_shipment_volume.trim() !== ""
      ? body.monthly_shipment_volume.trim()
      : null;

  try {
    const result = await completeSignupOrganizationForUser(supabase, {
      name,
      slug: slugInput,
      teamSize,
      monthlyShipmentVolume,
    });

    return NextResponse.json({ id: result.organizationId, inviteId: result.inviteId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create organization";
    const status = /already belong|slug already exists/i.test(message)
      ? 409
      : /unauthorized|different user/i.test(message)
        ? 403
        : /required|invalid|not found/i.test(message)
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
