import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWorkspaceStorageSignedUrlQuery } from "@/services/workspace-actions.server";

function isLikelyUuid(segment: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(segment);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { storagePath?: string; expiresSec?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";
  if (!storagePath) {
    return NextResponse.json({ error: "storagePath required" }, { status: 400 });
  }

  const orgSegment = storagePath.split("/")[0]?.trim() ?? "";
  if (!isLikelyUuid(orgSegment)) {
    return NextResponse.json({ error: "Invalid workspace storage path" }, { status: 400 });
  }

  const expiresSec = Math.min(86400, Math.max(60, Number(body.expiresSec ?? 3600) || 3600));

  try {
    const url = await createWorkspaceStorageSignedUrlQuery(supabase, storagePath, expiresSec);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create signed URL" },
      { status: 400 },
    );
  }
}
