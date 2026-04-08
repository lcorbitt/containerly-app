import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postShipmentScopeMessageWithAttachmentsForUser } from "@/services/workspace-actions.server";

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

  const body = String(formData.get("body") ?? "");
  const internalOnly = formData.get("internalOnly") === "true";
  const replyRaw = formData.get("replyParentId");
  const replyParentId =
    typeof replyRaw === "string" && replyRaw.trim() !== "" ? replyRaw.trim() : null;
  const files = formData.getAll("file").filter((x): x is File => x instanceof File && x.size > 0);

  try {
    const result = await postShipmentScopeMessageWithAttachmentsForUser(
      supabase,
      user.id,
      user.email ?? null,
      {
        organizationId: orgId,
        shipmentId,
        body,
        internalOnly,
        replyParentId,
        files,
      },
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Post failed" },
      { status: 400 },
    );
  }
}
