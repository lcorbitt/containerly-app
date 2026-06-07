import { redirect } from "next/navigation";
import { ProfileImageSettings } from "@/app/(authenticated)/settings/components/ProfileImageSettings";
import { SettingsDisplayName } from "@/app/(authenticated)/settings/components/SettingsDisplayName";
import { createClient } from "@/lib/supabase/server";
import { fetchSettingsPageProfileQuery } from "@/services/profile.server";

export const dynamic = "force-dynamic";

export default async function CustomerSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: Awaited<ReturnType<typeof fetchSettingsPageProfileQuery>>;
  try {
    profile = await fetchSettingsPageProfileQuery(supabase, user.id);
  } catch (e) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Could not load your profile: {e instanceof Error ? e.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const email = profile.email ?? user.email ?? "";
  const fullName = profile.fullName?.trim() || "";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Update your profile photo and display name.
      </p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Account
        </h2>
        <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:gap-10">
          <ProfileImageSettings
            initialProfileImagePath={profile.profileImagePath}
            fullName={fullName}
            email={email}
            accountColumn
          />
          <div className="min-w-0 flex-1 space-y-5 text-sm">
            <div>
              <p className="text-zinc-500 dark:text-zinc-500">Email</p>
              <p className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{email || "—"}</p>
            </div>
            <SettingsDisplayName initialFullName={fullName} />
          </div>
        </div>
      </section>
    </div>
  );
}
