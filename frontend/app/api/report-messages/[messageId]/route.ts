import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteReportMessageByIdForUser } from "@/services/workspace-actions.server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteReportMessageByIdForUser(supabase, messageId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
