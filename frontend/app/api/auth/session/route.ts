import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Establishes Supabase auth cookies on the Next server from browser session tokens. */
export async function POST(request: Request) {
  let body: { access_token?: string; refresh_token?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const accessToken =
    typeof body.access_token === "string" ? body.access_token.trim() : "";
  const refreshToken =
    typeof body.refresh_token === "string" ? body.refresh_token.trim() : "";
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Missing session tokens" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid session" },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
