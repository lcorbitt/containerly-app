import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadShipmentScopeStandaloneFilesForUser } from "@/services/workspace-actions.server";

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string; shipmentId: string }> },
) {
  const { orgId, shipmentId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const isInternal = formData.get("isInternal") === "true";
  const files = formData.getAll("file").filter((x): x is File => x instanceof File && x.size > 0);

  try {
    const uploaded = await uploadShipmentScopeStandaloneFilesForUser(supabase, user.id, {
      organizationId: orgId,
      shipmentId,
      files,
      isInternal,
    });
    return NextResponse.json({ uploaded });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
