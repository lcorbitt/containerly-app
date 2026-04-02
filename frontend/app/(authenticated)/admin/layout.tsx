import { redirect } from "next/navigation";
import { getSessionProfile, isSuperadminRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const profile = await getSessionProfile(supabase, user.id);
  if (!isSuperadminRole(profile?.role)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
