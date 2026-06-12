import { redirect } from "next/navigation";
import { CustomerAppShell } from "./components/CustomerAppShell";
import { loadAuthenticatedLayoutSession } from "@/server/loaders/authenticated-layout";

/** Customer-only shell: sidenav + personal settings; operators are bounced out. */
export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await loadAuthenticatedLayoutSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.isCustomer) {
    redirect("/dashboard");
  }

  return (
    <CustomerAppShell
      userId={session.user.id}
      email={session.user.email ?? ""}
      fullName={session.profile?.full_name ?? null}
      initialProfileImagePath={session.profile?.profile_image_path ?? null}
    >
      {children}
    </CustomerAppShell>
  );
}
