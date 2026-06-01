import { redirect } from "next/navigation";
import { loadAuthenticatedLayoutSession } from "@/services/authenticated-layout.server";
import { AuthenticatedAppShell } from "./components/AuthenticatedAppShell";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await loadAuthenticatedLayoutSession();

  if (!session) {
    redirect("/login");
  }

  const { user, profile, isSuperAdmin, initialOrgs } = session;

  return (
    <AuthenticatedAppShell
      userId={user.id}
      email={user.email ?? ""}
      fullName={profile?.full_name ?? null}
      initialProfileImagePath={profile?.profile_image_path ?? null}
      initialOrgs={initialOrgs}
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </AuthenticatedAppShell>
  );
}
