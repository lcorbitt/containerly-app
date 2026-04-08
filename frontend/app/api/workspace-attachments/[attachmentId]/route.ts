import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  removeWorkspaceAttachmentByIdForUser,
  renameWorkspaceAttachmentFileNameForUser,
} from "@/services/workspace-actions.server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { file_name?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const fileName = typeof body.file_name === "string" ? body.file_name.trim() : "";
  if (!fileName) {
    return NextResponse.json({ error: "file_name required" }, { status: 400 });
  }

  try {
    await renameWorkspaceAttachmentFileNameForUser(supabase, attachmentId, fileName);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Rename failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await removeWorkspaceAttachmentByIdForUser(supabase, attachmentId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}
