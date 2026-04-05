import { NextResponse } from "next/server";
import { getSessionProfile, isSuperadminRole } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationMemberRole } from "@/types/database";

function inviteRedirectTo(): string | undefined {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (!base) return undefined;
  const clean = base.replace(/\/$/, "");
  return `${clean}/login`;
}

async function resolveUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  emailLower: string,
): Promise<{ userId: string | null; invited: boolean; error?: string }> {
  const { data: profileRow, error: pErr } = await admin
    .from("profiles")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();

  if (pErr) {
    return { userId: null, invited: false, error: pErr.message };
  }
  if (profileRow?.id) {
    return { userId: profileRow.id as string, invited: false };
  }

  const redirectTo = inviteRedirectTo();
  const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(
    emailLower,
    redirectTo ? { redirectTo } : undefined,
  );
  if (!invErr && inv.user?.id) {
    return { userId: inv.user.id, invited: true };
  }

  const msg = invErr?.message?.toLowerCase() ?? "";
  const already =
    msg.includes("already") ||
    msg.includes("registered") ||
    msg.includes("exists");
  if (!already) {
    return { userId: null, invited: false, error: invErr?.message ?? "Could not invite user" };
  }

  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 25; i++) {
    const { data: pageData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
    if (listErr) {
      return { userId: null, invited: false, error: listErr.message };
    }
    const users = pageData?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === emailLower);
    if (found?.id) {
      return { userId: found.id, invited: false };
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return {
    userId: null,
    invited: false,
    error: "User exists but could not be resolved; try a smaller user directory or add them after they sign up.",
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionProfile = await getSessionProfile(supabase, user.id);

  let body: { organization_id?: string; email?: string; role?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = typeof body.organization_id === "string" ? body.organization_id.trim() : "";
  const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role: OrganizationMemberRole = body.role === "admin" ? "admin" : "member";

  if (!orgId) {
    return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
  }
  if (!emailRaw || !emailRaw.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (!isSuperadminRole(sessionProfile?.role)) {
    const { data: mem } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (mem?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: service role unavailable" },
      { status: 500 },
    );
  }

  const resolved = await resolveUserIdByEmail(admin, emailRaw);
  if (resolved.error || !resolved.userId) {
    return NextResponse.json(
      { error: resolved.error ?? "Could not resolve user" },
      { status: 400 },
    );
  }

  const { data: inserted, error: insErr } = await supabase
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: resolved.userId,
      role,
    })
    .select("id, organization_id, user_id, role, created_at")
    .single();

  if (insErr) {
    const dup = /duplicate|unique/i.test(insErr.message);
    return NextResponse.json(
      { error: insErr.message },
      { status: dup ? 409 : 500 },
    );
  }

  return NextResponse.json({
    membership: inserted,
    invited: resolved.invited,
  });
}
