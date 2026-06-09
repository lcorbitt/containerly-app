import Link from "next/link";
import { Building2, Mail, MessageSquarePlus } from "lucide-react";
import { AdminOrgMembersTable } from "@/app/(authenticated)/admin/components/AdminOrgMembersTable";
import { AdminProfilesTable } from "@/app/(authenticated)/admin/components/AdminProfilesTable";
import { createClient } from "@/lib/supabase/server";
import { loadAdminProfilesWithOrgLabels } from "@/services/admin.server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { rows: profilesWithOrgs, profilesError, membersError } =
    await loadAdminProfilesWithOrgLabels(supabase);

  if (profilesError) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <p className="text-sm text-red-600">Could not load profiles: {profilesError.message}</p>
      </div>
    );
  }

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
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/feedback"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <MessageSquarePlus className="h-4 w-4 opacity-80" aria-hidden />
            Feedback
          </Link>
          <Link
            href="/admin/invites"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Mail className="h-4 w-4 opacity-80" aria-hidden />
            Invites
          </Link>
          <Link
            href="/admin/organizations"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Building2 className="h-4 w-4 opacity-80" aria-hidden />
            Organizations
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-col gap-8 lg:gap-10">
        <AdminOrgMembersTable />
        {membersError ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            Organization names could not be loaded for the platform table: {membersError.message}
          </p>
        ) : null}
        <AdminProfilesTable initialProfiles={profilesWithOrgs} currentUserId={user?.id ?? ""} />
      </div>
    </div>
  );
}
