import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteReportMessageByIdForUser,
  updateReportMessageByIdForUser,
} from "@/services/workspace-actions.server";

export async function PATCH(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body === "object" && body !== null && "body" in body
    ? (body as { body: unknown }).body
    : undefined;
  if (typeof text !== "string") {
    return NextResponse.json({ error: "body (string) is required" }, { status: 400 });
  }

  try {
    const message = await updateReportMessageByIdForUser(supabase, user.id, messageId, text);
    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}

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
