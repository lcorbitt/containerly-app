import { ContainerWorkspace } from "@/components/container-workspace";

export default async function ContainerWorkspacePage({
  params,
}: Readonly<{
  params: Promise<{ containerId: string }>;
}>) {
  const { containerId } = await params;
  return <ContainerWorkspace containerId={containerId} />;
}
