import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { slugFromOrganizationName } from "@/utils/organization-slug";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function createOrganizationWithInitialAdmin(input: {
  admin: AdminClient;
  name: string;
  slugInput: string | null;
  adminUserId: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string; status: number }> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "name is required", status: 400 };
  }

  const slug =
    (input.slugInput && input.slugInput.trim() !== "" ? input.slugInput.trim() : null) ??
    slugFromOrganizationName(name);
  const slugFinal = slug.trim();
  if (!slugFinal) {
    return { ok: false, error: "Invalid slug", status: 400 };
  }

  const { data: org, error: orgErr } = await input.admin
    .from("organizations")
    .insert({ name, slug: slugFinal })
    .select("id")
    .single();

  if (orgErr) {
    const msg = orgErr.message ?? "Could not create organization";
    const status = /duplicate|unique/i.test(msg) ? 409 : 500;
    return { ok: false, error: msg, status };
  }

  const { error: memErr } = await input.admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: input.adminUserId,
    role: "admin",
  });

  if (memErr) {
    await input.admin.from("organizations").delete().eq("id", org.id);
    return {
      ok: false,
      error: memErr.message ?? "Could not add organization admin",
      status: 500,
    };
  }

  return { ok: true, organizationId: org.id as string };
}
