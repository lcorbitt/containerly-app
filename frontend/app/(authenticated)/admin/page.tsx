import Link from "next/link";
import { Building2 } from "lucide-react";
import { AdminOrgMembersTable } from "@/components/admin-org-members-table";
import { AdminProfilesTable } from "@/components/admin-profiles-table";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profilesRes, membersRes] = await Promise.all([
    supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false }),
    supabase.from("organization_members").select("user_id, organizations(name)"),
  ]);

  if (profilesRes.error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <p className="text-sm text-red-600">Could not load profiles: {profilesRes.error.message}</p>
      </div>
    );
  }

  const orgNamesByUser = new Map<string, Set<string>>();
  if (!membersRes.error) {
    for (const m of membersRes.data ?? []) {
      const o = m.organizations as { name: string } | { name: string }[] | null;
      const org = Array.isArray(o) ? o[0] : o;
      const name = org?.name?.trim();
      if (!name) continue;
      if (!orgNamesByUser.has(m.user_id)) orgNamesByUser.set(m.user_id, new Set());
      orgNamesByUser.get(m.user_id)!.add(name);
    }
  }

  const profilesWithOrgs = (profilesRes.data ?? []).map((p) => ({
    ...p,
    organizations_label:
      [...(orgNamesByUser.get(p.id) ?? [])].sort((a, b) => a.localeCompare(b)).join(", ") || "—",
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Platform administration
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Users
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Manage <strong>organization membership roles</strong> (admin / member) and{" "}
            <strong>platform superadmin</strong> accounts. Large tables use search, org filter, and paging in the
            browser; move to API pagination when datasets grow beyond what loads comfortably in one request.
          </p>
        </div>
        <Link
          href="/admin/organizations"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <Building2 className="h-4 w-4 opacity-80" aria-hidden />
          Organizations
        </Link>
      </header>

      <div className="flex min-h-0 flex-col gap-8 lg:gap-10">
        <AdminOrgMembersTable />
        {membersRes.error ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            Organization names could not be loaded for the platform table: {membersRes.error.message}
          </p>
        ) : null}
        <AdminProfilesTable initialProfiles={profilesWithOrgs} currentUserId={user?.id ?? ""} />
      </div>
    </div>
  );
}
