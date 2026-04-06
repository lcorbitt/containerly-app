import { ContainerWorkspace } from "./components/ContainerWorkspace";

export default async function ContainerWorkspacePage({
  params,
}: Readonly<{
  params: Promise<{ containerId: string }>;
}>) {
  const { containerId } = await params;
  return <ContainerWorkspace containerId={containerId} />;
}
