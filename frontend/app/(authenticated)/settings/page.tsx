import { redirect } from "next/navigation";
import { SettingsPageTabs } from "./components/SettingsPageTabs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, email, profile_image_path")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Could not load your profile: {error.message}
        </p>
      </div>
    );
  }

  const email = profile?.email ?? user.email ?? "";
  const fullName = profile?.full_name?.trim() || "";
  const displayLabel = fullName || email || "You";
  const profileImagePath =
    typeof profile?.profile_image_path === "string" ? profile.profile_image_path : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Personal profile and, for organization admins, branding and team access.
      </p>

      <SettingsPageTabs
        userId={user.id}
        email={email}
        fullName={fullName}
        displayLabel={displayLabel}
        profileImagePath={profileImagePath}
      />
    </div>
  );
}
