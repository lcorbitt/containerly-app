import { redirect } from "next/navigation";

export default async function LegacyDashboardRequestRedirect({
  params,
}: Readonly<{
  params: Promise<{ requestId: string }>;
}>) {
  const { requestId } = await params;
  redirect(`/requests/${requestId}`);
}
