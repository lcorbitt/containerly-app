import { redirect } from "next/navigation";
import { loadAuthenticatedLayoutSession } from "@/services/authenticated-layout.server";

/** Superadmin-only segment; parent `(authenticated)/layout` already enforces sign-in. */
export default async function AdminSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await loadAuthenticatedLayoutSession();

  if (!session) {
    redirect("/login?next=/admin");
  }

  if (!session.isSuperAdmin) {
    redirect("/dashboard");
  }

  return children;
}
