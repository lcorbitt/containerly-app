import { TrackingRequestWorkspace } from "@/components/tracking-request-workspace";

export default async function TrackingRequestPage({
  params,
}: Readonly<{
  params: Promise<{ requestId: string }>;
}>) {
  const { requestId } = await params;
  return <TrackingRequestWorkspace requestId={requestId} />;
}
