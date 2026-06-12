import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SettingsPageTabs } from "./components/SettingsPageTabs";
import { createClient } from "@/lib/supabase/server";
import { fetchSettingsPageProfileQuery } from "@/services/profile.server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
  const displayLabel = fullName || email || "You";
  const profileImagePath = profile.profileImagePath;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Personal profile and, for organization admins, branding and team access.
      </p>

      <Suspense fallback={<div className="mt-8 text-sm text-zinc-500">Loading settings…</div>}>
        <SettingsPageTabs
          email={email}
          fullName={fullName}
          displayLabel={displayLabel}
          profileImagePath={profileImagePath}
        />
      </Suspense>
    </div>
  );
}
