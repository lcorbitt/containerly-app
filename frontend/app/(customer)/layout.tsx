import { redirect } from "next/navigation";
import { PortalTopNav } from "@/components/TopNav";
import { loadAuthenticatedLayoutSession } from "@/services/authenticated-layout.server";

/** Customer-only shell: no operator SideNav, no operator routes. Operators are bounced out. */
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
    <div className="portal-shell flex min-h-0 flex-1 flex-col">
      <PortalTopNav sharedShipmentsHref="/my-shipments" />
      <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
