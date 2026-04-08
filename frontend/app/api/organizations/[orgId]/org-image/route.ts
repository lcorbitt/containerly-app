import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  clearOrganizationImagePathServer,
  fetchOrganizationImagePathQuery,
  uploadOrganizationImageAndSetPathServer,
} from "@/services/organization.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const path = await fetchOrganizationImagePathQuery(supabase, orgId);
    return NextResponse.json({ path });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load image path" },
      { status: 400 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
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

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const previousRaw = formData.get("previousPath");
  const previousPath =
    typeof previousRaw === "string" && previousRaw.trim() !== "" ? previousRaw.trim() : null;

  try {
    const path = await uploadOrganizationImageAndSetPathServer(supabase, {
      organizationId: orgId,
      file,
      previousPath,
    });
    return NextResponse.json({ path });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { storagePath?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";
  if (!storagePath) {
    return NextResponse.json({ error: "storagePath required" }, { status: 400 });
  }

  try {
    const result = await clearOrganizationImagePathServer(supabase, {
      organizationId: orgId,
      storagePath,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Remove failed" },
      { status: 400 },
    );
  }
}
